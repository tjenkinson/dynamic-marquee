import { Item, VirtualItem } from './item.js';
import { DIRECTION } from './direction.js';
import { defer, deferException, toDomEl } from './helpers.js';
import { SizeWatcher } from './size-watcher.js';

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
    this._rendering = false;
    this._waitingForItem = true;
    this._nextItemImmediatelyFollowsPrevious = startOnScreen;
    this._rate = rate;
    this._lastEffectiveRate = rate;
    this._justReversedRate = false;
    this._direction = upDown ? DIRECTION.DOWN : DIRECTION.RIGHT;
    this._onItemRequired = [];
    this._onItemRemoved = [];
    this._onAllItemsRemoved = [];
    this._leftItemOffset = 0;
    this._containerSize = 0;
    this._previousContainerSize = null;
    this._containerSizeWatcher = null;
    this._items = [];
    this._pendingItem = null;
    const $innerContainer = document.createElement('div');
    $innerContainer.style.position = 'relative';
    $innerContainer.style.display = 'inline-block';
    this._$container = $innerContainer;
    this._containerInverseSize = null;
    $innerContainer.style.width = '100%';
    if (this._direction === DIRECTION.DOWN) {
      $innerContainer.style.height = '100%';
    }
    this._updateContainerInverseSize();
    $container.appendChild($innerContainer);
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
    return this._items.filter(({ item }) => item instanceof Item).length;
  }

  setRate(rate) {
    if (rate === this._rate) {
      return;
    }

    if (!rate !== !this._rate) {
      this._enableAnimationHint(!!rate);
      if (rate) {
        this._scheduleRender(true);
      }
    }

    if (rate * this._lastEffectiveRate < 0) {
      this._justReversedRate = !this._justReversedRate;

      if (rate <= 0) {
        const containerSize = this._containerSize;
        let nextOffset = this._leftItemOffset;
        this._items.forEach(({ item }) => {
          nextOffset += item.getSize();
        });
        this._waitingForItem = nextOffset <= containerSize;
      } else {
        this._waitingForItem = this._leftItemOffset >= 0;
      }
    }

    this._rate = rate;
    if (rate) {
      this._lastEffectiveRate = rate;
    }
  }

  getRate() {
    return this._rate;
  }

  clear() {
    this._items.forEach(({ item }) => this._removeItem(item));
    this._items = [];
    this._waitingForItem = true;
    this._updateContainerInverseSize();
  }

  isWaitingForItem() {
    return this._waitingForItem;
  }

  appendItem($el) {
    if (!this._waitingForItem) {
      throw new Error('No room for item.');
    }
    // convert to div if $el is a string
    $el = toDomEl($el);
    const itemAlreadyExists = this._items.some(({ item }) => {
      return item instanceof Item && item.getOriginalEl() === $el;
    });
    if (itemAlreadyExists) {
      throw new Error('Item already exists.');
    }
    this._waitingForItem = false;
    this._pendingItem = new Item($el, this._direction);
    this._pendingItem.enableAnimationHint(!!this._rate);
    if (this._rendering) {
      this._render(0);
    } else {
      this._scheduleRender(true);
    }
  }

  _removeItem({ item }) {
    defer(() => {
      item.remove();
      if (item instanceof Item) {
        this._onItemRemoved.forEach((cb) => {
          deferException(() => cb(item.getOriginalEl()));
        });
      }
    });
  }

  // update size of container so that the marquee items fit inside it.
  // This is needed because the items are posisitioned absolutely, so not in normal flow.
  // Without this, for DIRECTION.RIGHT, the height of the container would always be 0px, which is not useful
  _updateContainerInverseSize() {
    if (this._direction === DIRECTION.DOWN) {
      return;
    }

    const maxSize = this._items.reduce((size, { item }) => {
      if (item instanceof VirtualItem) {
        return size;
      }
      const a = item.getSize({ inverse: true });
      if (a > size) {
        return a;
      }
      return size;
    }, 0);

    if (this._containerInverseSize !== maxSize) {
      this._containerInverseSize = maxSize;
      this._$container.style.height = `${maxSize}px`;
    }
  }

  _enableAnimationHint(enable) {
    this._items.forEach(({ item }) => item.enableAnimationHint(enable));
  }

  _scheduleRender(immediate) {
    if (immediate) {
      if (this._renderTimer) window.clearTimeout(this._renderTimer);
      this._renderTimer = null;
    }

    if (!this._renderTimer) {
      this._lastUpdateTime = performance.now();
      // ideally we'd use requestAnimationFrame here but there's a bug in
      // chrome which means when the callback is called it triggers a style
      // recalculation even when nothing changes, which is not efficient
      // see https://bugs.chromium.org/p/chromium/issues/detail?id=1252311
      // and https://stackoverflow.com/q/69293778/1048589
      this._renderTimer = window.setTimeout(
        () => this._tick(),
        immediate ? 0 : 100
      );
    }
  }

  _tick() {
    this._renderTimer = null;
    if (!this._items.length && !this._pendingItem) {
      this._containerSizeWatcher.tearDown();
      this._containerSizeWatcher = null;
      return;
    }

    if (!this._containerSizeWatcher) {
      this._containerSizeWatcher = new SizeWatcher(this._$container);
    }

    const now = performance.now();
    const timePassed = now - this._lastUpdateTime;
    if (this._rate) {
      this._scheduleRender();
    }

    this._rendering = true;
    const shiftAmount = this._rate * (timePassed / 1000);
    this._containerSize =
      this._direction === DIRECTION.RIGHT
        ? this._containerSizeWatcher.getWidth()
        : this._containerSizeWatcher.getHeight();
    deferException(() => this._render(shiftAmount));
    this._rendering = false;
  }

  _render(shiftAmount) {
    this._leftItemOffset += shiftAmount;
    const containerSize = this._containerSize;
    if (this._rate < 0) {
      while (this._items.length) {
        const { item } = this._items[0];
        const size = item.getSize();
        if (this._leftItemOffset + size > 0) {
          break;
        }
        this._removeItem(this._items[0]);
        this._items.shift();
        this._leftItemOffset += size;
      }
    }

    const offsets = [];
    let nextOffset = this._leftItemOffset;
    this._items.some(({ item }, i) => {
      if (nextOffset >= containerSize) {
        if (this._rate > 0) {
          this._items.splice(i).forEach((a) => this._removeItem(a));
          return true;
        }
      }
      offsets.push(nextOffset);
      nextOffset += item.getSize();
      return false;
    });

    const justReversedRate = this._justReversedRate;
    this._justReversedRate = false;
    if (justReversedRate) {
      this._nextItemImmediatelyFollowsPrevious = false;
    }

    if (this._pendingItem) {
      this._$container.appendChild(this._pendingItem.getContainer());
      if (this._rate <= 0) {
        if (!this._nextItemImmediatelyFollowsPrevious) {
          // insert virtual item so that it starts off screen
          this._items.push({
            item: new VirtualItem(Math.max(0, containerSize - nextOffset)),
            offset: nextOffset,
          });
          offsets.push(nextOffset);
          nextOffset = containerSize;
        }
        this._items.push({
          item: this._pendingItem,
          offset: nextOffset,
        });
        offsets.push(nextOffset);
        nextOffset += this._pendingItem.getSize();
      } else {
        if (this._nextItemImmediatelyFollowsPrevious && !this._items.length) {
          this._leftItemOffset = containerSize;
        } else if (
          !this._nextItemImmediatelyFollowsPrevious &&
          this._items.length &&
          this._leftItemOffset > 0
        ) {
          this._items.unshift({
            item: new VirtualItem(this._leftItemOffset),
            offset: 0,
          });
          offsets.unshift(0);
          this._leftItemOffset = 0;
        }
        this._leftItemOffset -= this._pendingItem.getSize();
        offsets.unshift(this._leftItemOffset);
        this._items.unshift({
          item: this._pendingItem,
          offset: this._leftItemOffset,
        });
      }
      this._pendingItem = null;
    }

    // trim virtual items
    while (this._items.length && this._items[0].item instanceof VirtualItem) {
      offsets.shift();
      this._items.shift();
      this._leftItemOffset = offsets[0] || 0;
    }
    while (
      this._items.length &&
      this._items[this._items.length - 1].item instanceof VirtualItem
    ) {
      offsets.pop();
      this._items.pop();
    }

    const containerSizeChanged =
      this._containerSize !== this._previousContainerSize;
    this._previousContainerSize = this._containerSize;

    offsets.forEach((offset, i) => {
      const item = this._items[i];
      const hasJumped = Math.abs(item.offset + shiftAmount - offset) >= 1;
      item.item.setOffset(
        offset,
        this._rate,
        containerSizeChanged || hasJumped
      );
      item.offset = offset;
    });
    this._updateContainerInverseSize();

    if (!this._items.length) {
      this._leftItemOffset = 0;
      defer(() => {
        this._onAllItemsRemoved.forEach((cb) => {
          deferException(() => cb());
        });
      });
    }

    this._nextItemImmediatelyFollowsPrevious = false;

    if (
      !this._waitingForItem &&
      ((this._rate <= 0 && nextOffset <= containerSize) ||
        (this._rate > 0 && this._leftItemOffset >= 0))
    ) {
      this._waitingForItem = true;
      // if an item is appended immediately below, it would be considered immediately following
      // the previous if we haven't just changed direction.
      // This is useful when deciding whether to add a separator on the side that enters the
      // screen first or not
      this._nextItemImmediatelyFollowsPrevious = !justReversedRate;

      let nextItem;
      this._onItemRequired.some((cb) => {
        return deferException(() => {
          nextItem = cb({
            immediatelyFollowsPrevious: this
              ._nextItemImmediatelyFollowsPrevious,
          });
          return !!nextItem;
        });
      });
      if (nextItem) {
        // Note appendItem() will call _render() synchronously again
        this.appendItem(nextItem);
      }
      this._nextItemImmediatelyFollowsPrevious = false;
    }
  }
}
