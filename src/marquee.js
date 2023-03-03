import { Boundary } from '@tjenkinson/boundary';
import { Item } from './item.js';
import { Slider } from './slider.js';
import { DIRECTION } from './direction.js';
import { defer, deferException, toDomEl, first, last } from './helpers.js';
import { SizeWatcher } from './size-watcher.js';

const maxTranslateDistance = 500000;
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
    } = {}
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
    this._nextItemWouldBeTouching = startOnScreen;
    this._rate = rate;
    this._lastEffectiveRate = rate;
    this._justReversedRate = false;
    this._correlation = null;
    this._direction = upDown ? DIRECTION.DOWN : DIRECTION.RIGHT;
    this._onItemRequired = [];
    this._onItemRemoved = [];
    this._onAllItemsRemoved = [];
    this._windowOffset = 0;
    this._containerSize = 0;
    this._containerSizeWatcher = null;
    this._items = [];
    this._pendingItem = null;
    this._visible = !!document.hidden;
    this._waitingForRaf = false;
    const $window = document.createElement('div');
    $window.style.display = 'block';
    $window.style.overflow = 'hidden';
    $window.style.position = 'relative';
    if (this._direction === DIRECTION.DOWN) {
      $window.style.height = '100%';
    }
    this._$window = $window;
    this.windowInverseSize = null;
    this._updateWindowInverseSize();
    const $moving = document.createElement('div');
    this._$moving = $moving;
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
    }

    this._rate = rate;
    if (rate) {
      this._lastEffectiveRate = rate;
      if (!this._items.length) {
        this._waitingForItem = true;
      }
    } else {
      this._waitingForItem = false;
    }

    this._tick(this._waitingForItem);
  }

  getRate() {
    return this._rate;
  }

  clear() {
    this._boundary.enter(() => {
      this._items.forEach(({ item }) => this._removeItem(item));
      this._items = [];
      this._waitingForItem = true;
      this._nextItemWouldBeTouching = false;
      this._updateWindowInverseSize();
      this._cleanup();
    });
  }

  isWaitingForItem() {
    return this._waitingForItem;
  }

  appendItem($el, { metadata = null } = {}) {
    this._boundary.enter(() => {
      if (!this._waitingForItem) {
        throw new Error('No room for item.');
      }
      // convert to div if $el is a string
      $el = toDomEl($el);
      const itemAlreadyExists = this._items.some(({ item }) => {
        return item.getOriginalEl() === $el;
      });
      if (itemAlreadyExists) {
        throw new Error('Item already exists.');
      }
      this._waitingForItem = false;
      this._pendingItem = new Item($el, this._direction, metadata, () =>
        this._tickOnRaf()
      );
      this._tick();
    });
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

    const maxSize = Math.max(
      ...this._items.map(({ item }) => item.getSize({ inverse: true }))
    );

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
    this._containerSizeWatcher?.tearDown();
    this._containerSizeWatcher = null;
    this._correlation = null;
    this._windowOffset = 0;
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

      if (!this._containerSizeWatcher) {
        this._containerSizeWatcher = new SizeWatcher(this._$window, () =>
          this._tickOnRaf()
        );
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
        resynced || goneVisible
      );

      if (!this._correlation || this._correlation.rate !== this._rate) {
        this._correlation = {
          time: now,
          offset: this._windowOffset,
          rate: this._rate,
        };
      }

      this._containerSize =
        this._direction === DIRECTION.RIGHT
          ? this._containerSizeWatcher.getWidth()
          : this._containerSizeWatcher.getHeight();

      // if container has size 0 pretend it is 1 to prevent infinite loop
      // of adding items that are instantly removed
      const containerSize = Math.max(this._containerSize, 1);
      const justReversedRate = this._justReversedRate;
      this._justReversedRate = false;
      const newItemWouldBeTouching = this._nextItemWouldBeTouching;
      this._nextItemWouldBeTouching = null;
      let nextItemTouching = null;

      // calculate what the new offsets should be given item sizes may have changed
      this._items.reduce((newOffset, item) => {
        if (newOffset !== null && item.offset < newOffset) {
          // the size of the item before has increased and would now be overlapping
          // this one, so shuffle this one along.
          item.offset = newOffset;
        }
        item.item.setOffset(item.offset);
        return item.offset + item.item.getSize();
      }, null);

      if (this._pendingItem) {
        this._$moving.appendChild(this._pendingItem.getContainer());
        const touching =
          this._rate <= 0 ? last(this._items) : first(this._items);
        if (this._rate <= 0) {
          this._items = [
            ...this._items,
            {
              item: this._pendingItem,
              appendRate: this._rate,
              offset: newItemWouldBeTouching
                ? touching
                  ? touching.offset + touching.item.getSize()
                  : this._windowOffset
                : this._windowOffset + containerSize,
            },
          ];
        } else {
          this._items = [
            {
              item: this._pendingItem,
              appendRate: this._rate,
              offset: newItemWouldBeTouching
                ? touching
                  ? touching.offset - this._pendingItem.getSize()
                  : this._windowOffset +
                    containerSize -
                    this._pendingItem.getSize()
                : this._windowOffset - this._pendingItem.getSize(),
            },
            ...this._items,
          ];
        }
        this._pendingItem = null;
      }

      // add a buffer on the side to make sure that new elements are added before they would actually be on screen
      const buffer = (renderInterval / 1000) * Math.abs(this._rate);
      let requireNewItem = this._waitingForItem;
      if (
        !this._waitingForItem &&
        this._items.length /* there should always be items at this point */
      ) {
        const firstItem = first(this._items);
        const lastItem = last(this._items);
        const touching = this._rate <= 0 ? lastItem : firstItem;
        if (
          (this._rate <= 0 &&
            lastItem.offset + lastItem.item.getSize() - this._windowOffset <=
              containerSize + buffer) ||
          (this._rate > 0 &&
            firstItem.offset - this._windowOffset > -1 * buffer)
        ) {
          this._waitingForItem = requireNewItem = true;
          // if an item is appended immediately below, it would be considered touching
          // the previous if we haven't just changed direction.
          // This is useful when deciding whether to add a separator on the side that enters the
          // screen first or not
          nextItemTouching = justReversedRate
            ? null
            : {
                $el: touching.item.getOriginalEl(),
                metadata: touching.item.getMetadata(),
              };
        }
      }

      if (nextItemTouching) {
        this._nextItemWouldBeTouching = true;
      }

      this._items = [...this._items].filter(({ item, offset }) => {
        const keep =
          this._rate < 0
            ? offset + item.getSize() > this._windowOffset
            : offset < this._windowOffset + containerSize;
        if (!keep) this._removeItem(item);
        return keep;
      });

      if (!this._items.length) {
        this._onAllItemsRemoved.forEach((cb) => callbacks.push(cb));
      }

      this._updateWindowInverseSize();

      if (requireNewItem) {
        let nextItem;
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
        this._nextItemWouldBeTouching = false;
      }
    });
  }
}
