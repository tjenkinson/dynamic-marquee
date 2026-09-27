import { Boundary } from '@tjenkinson/boundary';
import { Item } from './item.js';
import { Slider } from './slider.js';
import { DIRECTION } from './direction.js';
import { defer, deferException, toDomEl, first, last } from './helpers.js';
import { SizeWatcher } from './size-watcher.js';

// const maxTranslateDistance = 500000;
// const maxTranslateDistance = 1000;
const maxTranslateDistance = 500;
const renderInterval = 100;

export class Marquee {
  constructor(
    $container,
    {
      // pixels/s
      rate = -25,
      // make the direction down instead of right
      upDown = false,
      // start on screen
      startOnScreen = false,
    } = {},
  ) {
    this._boundary = new Boundary({
      onEnter: () => ({
        callbacks: [],
      }),
      onExit: ({ onEnterResult: { callbacks } }) => {
        callbacks.forEach((cb) => defer(() => cb()));
      },
    });

    this._waitingForItem = true;
    this._askedForItem = true;
    this._nextAppendIsSynchronous = false;
    this._rate = rate;
    this._lastEffectiveRate = rate;
    this._justReversedRate = false;
    this._correlation = null;
    this._direction = upDown ? DIRECTION.DOWN : DIRECTION.RIGHT;
    this._startOnScreen = startOnScreen;
    this._onItemRequired = [];
    this._onItemRemoved = [];
    this._onAllItemsRemoved = [];
    this._windowOffset = 0;
    this._resyncSlider = false;
    this._gapSize = 0;
    this._items = [];
    this._pendingItem = null;
    this._visible = !!document.hidden;
    this._waitingForRaf = false;
    const $window = document.createElement('div');
    // $window.style.all = 'unset';
    $window.style.display = 'block';
    // $window.style.overflow = 'hidden';
    $window.style.position = 'relative';
    if (this._direction === DIRECTION.DOWN) {
      $window.style.height = '100%';
    }
    this._$window = $window;
    this._containerSizeWatcher = new SizeWatcher($window);
    this._containerSizeWatcher.onSizeChange(() => {
      // when the page zoom changes the slider transform transition behaves in a weird way so this resets it
      this._resyncSlider = true;
      this._tickOnRaf();
    });
    this.windowInverseSize = null;
    this._updateWindowInverseSize();
    const $moving = document.createElement('div');
    this._$moving = $moving;
    // $moving.style.all = 'unset';
    $moving.style.display = 'block';
    $moving.style.position = 'absolute';
    $moving.style.left = '0';
    $moving.style.right = '0';
    this._slider = new Slider($moving, this._direction);
    $window.appendChild($moving);
    $container.appendChild($window);
  }

  // called when there's room for a new item.
  // You can return the item to append next
  onItemRequired(cb) {
    this._onItemRequired.push(cb);
  }

  // Called when an item is removed
  onItemRemoved(cb) {
    this._onItemRemoved.push(cb);
  }

  // Called when the last item is removed
  onAllItemsRemoved(cb) {
    this._onAllItemsRemoved.push(cb);
  }

  getNumItems() {
    return this._items.length;
  }

  setRate(rate) {
    if (rate === this._rate) {
      return;
    }

    if (rate * this._lastEffectiveRate < 0) {
      this._justReversedRate = !this._justReversedRate;
      // flip to false which will cause a new item to be asked for if necessary
      this._waitingForItem = this._askedForItem = false;
    }

    this._rate = rate;
    if (rate) {
      this._lastEffectiveRate = rate;
    }

    this._tick(true);
  }

  getRate() {
    return this._rate;
  }

  clear() {
    this._boundary.enter(() => {
      this._items.forEach(({ item }) => this._removeItem(item));
      this._items = [];
      this._waitingForItem = true;
      this._askedForItem = true;
      this._nextAppendIsSynchronous = false;
      this._updateWindowInverseSize();
      this._cleanup();
    });
  }

  isWaitingForItem() {
    return this._waitingForItem;
  }

  watchItemSize(elOrString) {
    const $el = toDomEl(elOrString);
    const item = new Item({
      $el,
      direction: this._direction,
    });
    this._$window.appendChild(item.getContainer());

    return {
      getSize: () => item.getSize(),
      onSizeChange: item.onSizeChange,
      stopWatching: () => item.remove(),
    };
  }

  appendItem(elOrString, { metadata = null, snapToNeighbour = false } = {}) {
    this._boundary.enter(() => {
      if (!this._waitingForItem) {
        throw new Error('No room for item.');
      }
      const $el = toDomEl(elOrString);
      const itemAlreadyExists = this._items.some(({ item }) => {
        return item.getOriginalEl() === $el;
      });
      if (itemAlreadyExists) {
        throw new Error('Item already exists.');
      }
      this._waitingForItem = false;
      this._askedForItem = false;
      const resolvedSnap =
        snapToNeighbour ||
        (this._startOnScreen && !this._items.length) ||
        this._nextAppendIsSynchronous;

      this._nextAppendIsSynchronous = false;

      this._pendingItem = new Item({
        $el,
        direction: this._direction,
        metadata,
        snapToNeighbor: resolvedSnap,
      });
      this._pendingItem.onSizeChange(() => this._tickOnRaf());
      this._tick();
    });
  }

  /**
   * Returns the amount of pixels that need to be filled.
   *
   * If `snapToNeighbour` is `true` then this includes the empty space
   * after the neighbouring item.
   *
   * If `snapToNeighbour` is `false`, then this will just contain the buffer
   * space, unless the `startOnScreen` option is `true` and there are currently
   * no items.
   */
  getGapSize({ snapToNeighbour } = {}) {
    if (!this._waitingForItem) return 0;

    let size;
    if (this._items.length) {
      size = snapToNeighbour ? this._gapSize : this._getBuffer();
    } else {
      size =
        this._startOnScreen || snapToNeighbour
          ? this._getContainerSize() + this._getBuffer()
          : this._getBuffer();
    }

    // if we're waiting for an item pretend it's at least 1 to handle cases like where we request for an item
    // but then the container size gets smalller meaning in reality the gap size becomes negative. If this happens
    // we don't flip from wanting an item to not wanting one so pretend there is some space.
    return Math.max(1, size);
  }

  _getContainerSize() {
    // if container has size 0 pretend it is 1 to prevent infinite loop
    // of adding items that are instantly removed
    return Math.max(
      this._direction === DIRECTION.RIGHT
        ? this._containerSizeWatcher.getWidth()
        : this._containerSizeWatcher.getHeight(),
      1,
    );
  }

  _getBuffer() {
    return (renderInterval / 1000) * Math.abs(this._rate);
  }

  _removeItem(item) {
    this._boundary.enter(({ callbacks }) => {
      item.remove();
      this._items.splice(this._items.indexOf(item), 1);
      this._onItemRemoved.forEach((cb) => {
        callbacks.push(() => cb(item.getOriginalEl()));
      });
    });
  }

  // update size of container so that the marquee items fit inside it.
  // This is needed because the items are posisitioned absolutely, so not in normal flow.
  // Without this, for DIRECTION.RIGHT, the height of the container would always be 0px, which is not useful
  _updateWindowInverseSize() {
    if (this._direction === DIRECTION.DOWN) {
      return;
    }

    const maxSize = this._items.length
      ? Math.max(
          ...this._items.map(({ item }) => item.getSize({ inverse: true })),
        )
      : 0;

    if (this.windowInverseSize !== maxSize) {
      this.windowInverseSize = maxSize;
      this._$window.style.height = `${maxSize}px`;
    }
  }

  _scheduleRender() {
    if (!this._renderTimer) {
      // ideally we'd use requestAnimationFrame here but there's a bug in
      // chrome which means when the callback is called it triggers a style
      // recalculation even when nothing changes, which is not efficient
      // see https://bugs.chromium.org/p/chromium/issues/detail?id=1252311
      // and https://stackoverflow.com/q/69293778/1048589
      this._renderTimer = window.setTimeout(() => this._tick(), renderInterval);
    }
  }

  _cleanup() {
    this._correlation = null;
    this._windowOffset = 0;
    this._resyncSlider = false;
  }

  _tickOnRaf() {
    if (!window.requestAnimationFrame || this._waitingForRaf) return;

    this._waitingForRaf = true;
    window.requestAnimationFrame(() => {
      this._waitingForRaf = false;
      this._tick();
    });
  }

  _tick(force = false) {
    this._boundary.enter(({ callbacks }) => {
      this._renderTimer && clearTimeout(this._renderTimer);
      this._renderTimer = null;

      if (!force && !this._items.length && !this._pendingItem) {
        this._cleanup();
        return;
      }

      this._scheduleRender();

      if (!this._$window.isConnected) {
        // pause if we've been removed from the dom
        this._correlation = null;
        return;
      }

      const now = performance.now();
      let resynced = false;

      if (this._correlation) {
        const timePassed = now - this._correlation.time;
        this._windowOffset =
          this._correlation.offset +
          this._correlation.rate * -1 * (timePassed / 1000);
      } else {
        resynced = true;
      }

      if (Math.abs(this._windowOffset) > maxTranslateDistance) {
        // resync so that the number of pixels we are translating doesn't get too big
        resynced = true;
        const shiftAmount = this._windowOffset;
        this._items.forEach((item) => (item.offset -= shiftAmount));
        this._correlation = null;
        this._windowOffset = 0;
      }

      const visible = !document.hidden;
      const goneVisible = visible && this._visible !== visible;
      this._visible = visible;

      this._slider.setOffset(
        this._windowOffset * -1,
        this._rate,
        resynced || goneVisible || this._resyncSlider,
      );
      this._resyncSlider = false;

      if (!this._correlation || this._correlation.rate !== this._rate) {
        this._correlation = {
          time: now,
          offset: this._windowOffset,
          rate: this._rate,
        };
      }

      const containerSize = this._getContainerSize();
      const justReversedRate = this._justReversedRate;
      this._justReversedRate = false;

      // remove items that are off screen
      this._items = [...this._items].filter(({ item, offset }) => {
        const keep =
          this._lastEffectiveRate <= 0
            ? offset + item.getSize() > this._windowOffset
            : offset < this._windowOffset + containerSize;
        if (!keep) this._removeItem(item);
        return keep;
      });

      // calculate what the new offsets should be given item sizes may have changed
      this._items.reduce((newOffset, item) => {
        if (
          newOffset !== null &&
          // size of the item before has increased and would be overlapping
          (item.offset < newOffset ||
            // this item is meant to always snap to the previous
            item.item.getSnapToNeighbor())
        ) {
          item.offset = newOffset;
        }
        item.item.setOffset(item.offset);
        return item.offset + item.item.getSize();
      }, null);

      if (this._pendingItem) {
        this._$moving.appendChild(this._pendingItem.getContainer());
        if (this._lastEffectiveRate <= 0) {
          const neighbour = last(this._items);
          const offsetIfWasTouching = neighbour
            ? neighbour.offset + neighbour.item.getSize()
            : this._windowOffset;
          this._items = [
            ...this._items,
            {
              item: this._pendingItem,
              offset: this._pendingItem.getSnapToNeighbor()
                ? offsetIfWasTouching
                : Math.max(
                    // edge case that would happen if new item requested and synchronously provided,
                    // but before during that another item size increases, or if new item was provided
                    // when it wasn't strictly needed, which can happen if you have negative rate,
                    // switch to positive which requests an item, and then switch back to negative again
                    // and provide an item
                    offsetIfWasTouching,
                    this._windowOffset + containerSize,
                  ),
            },
          ];
        } else {
          const neighbour = first(this._items);
          const offsetIfWasTouching = neighbour
            ? neighbour.offset - this._pendingItem.getSize()
            : this._windowOffset + containerSize - this._pendingItem.getSize();
          this._items = [
            {
              item: this._pendingItem,
              offset: this._pendingItem.getSnapToNeighbor()
                ? offsetIfWasTouching
                : Math.min(
                    // edge case that would happen if new item was provided when it wasn't strictly needed,
                    // which can happen if you have positive rate, switch to negative which requests an item,
                    // and then switch back to positive again and provide an item
                    offsetIfWasTouching,
                    this._windowOffset - this._pendingItem.getSize(),
                  ),
            },
            ...this._items,
          ];
        }
        this._pendingItem = null;
      }

      let nextItemTouching = null;
      this._gapSize = 0;

      // add a buffer on the side to make sure that new elements are added before they would actually be on screen
      const buffer = this._getBuffer();

      if (this._items.length) {
        const firstItem = first(this._items);
        const lastItem = last(this._items);
        const neighbour = this._lastEffectiveRate <= 0 ? lastItem : firstItem;

        if (this._lastEffectiveRate <= 0) {
          this._gapSize =
            containerSize +
            buffer -
            (lastItem.offset + lastItem.item.getSize() - this._windowOffset);
        } else {
          this._gapSize = firstItem.offset - this._windowOffset + buffer;
        }

        if (this._gapSize > 0) {
          this._waitingForItem = true;
          // if an item is appended immediately below, it would be considered touching
          // the previous if we haven't just changed direction.
          // This is useful when deciding whether to add a separator on the side that enters the
          // screen first or not
          nextItemTouching = !justReversedRate
            ? {
                $el: neighbour.item.getOriginalEl(),
                metadata: neighbour.item.getMetadata(),
              }
            : null;
        }
      } else {
        this._waitingForItem = true;
      }

      if (!this._items.length) {
        this._onAllItemsRemoved.forEach((cb) => callbacks.push(cb));
      }

      this._updateWindowInverseSize();

      if (this._waitingForItem && !this._askedForItem) {
        this._askedForItem = true;
        let nextItem;
        if (nextItemTouching) {
          this._nextAppendIsSynchronous = true;
        }
        this._onItemRequired.some((cb) => {
          return deferException(() => {
            nextItem = cb({
              /** @deprecated */
              immediatelyFollowsPrevious: !!nextItemTouching,
              touching: nextItemTouching,
            });
            return !!nextItem;
          });
        });
        if (nextItem) {
          // Note appendItem() will call _tick() synchronously again
          this.appendItem(nextItem);
        }
        this._nextAppendIsSynchronous = false;
      }
    });
  }
}
