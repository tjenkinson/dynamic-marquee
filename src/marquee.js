import { Item, VirtualItem } from './item.js';
import { DIRECTION } from './direction.js';
import { size, defer, deferException, toDomEl } from './helpers.js';

export class Marquee {
  constructor(
    $container,
    {
      // pixels/s
      rate = -25,
      // make the direction down instead of right
      upDown = false,
    } = {}
  ) {
    this._rendering = false;
    this._waitingForItem = true;
    this._nextItemImmediatelyFollowsPrevious = false;
    this._rate = rate;
    this._lastEffectiveRate = rate;
    this._justReversedRate = false;
    this._windowWidth = window.innerWidth;
    this._windowHeight = window.innerHeight;
    this._direction = upDown ? DIRECTION.DOWN : DIRECTION.RIGHT;
    this._onItemRequired = [];
    this._onItemRemoved = [];
    this._onAllItemsRemoved = [];
    this._leftItemOffset = 0;
    this._containerSize = 0;
    this._items = [];
    this._pendingItem = null;
    const $innerContainer = document.createElement('div');
    $innerContainer.style.position = 'relative';
    $innerContainer.style.display = 'inline-block';
    this._$container = $innerContainer;
    this._containerSizeInverse = null;
    if (this._direction === DIRECTION.RIGHT) {
      $innerContainer.style.width = '100%';
    } else {
      $innerContainer.style.height = '100%';
    }
    this._updateContainerSize();
    $container.appendChild($innerContainer);
    this._scheduleRender();
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
    if (!rate !== !this._rate) {
      this._enableAnimationHint(!!rate);
      if (rate) {
        this._scheduleRender();
      }
    }
    if (rate * this._lastEffectiveRate < 0) {
      this._justReversedRate = true;
      this._waitingForItem = false;
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
    this._updateContainerSize();
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
      this._scheduleRender();
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
  // Without this, the height of the container would always be 0px, which is not useful
  _updateContainerSize() {
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
    if (this._containerSizeInverse !== maxSize) {
      this._containerSizeInverse = maxSize;
      if (this._direction === DIRECTION.RIGHT) {
        this._$container.style.height = `${maxSize}px`;
      } else {
        this._$container.style.width = `${maxSize}px`;
      }
    }
  }

  _enableAnimationHint(enable) {
    this._items.forEach(({ item }) => item.enableAnimationHint(enable));
  }

  _scheduleRender() {
    if (!this._requestAnimationID) {
      this._lastUpdateTime = performance.now();
      this._requestAnimationID = window.requestAnimationFrame(() =>
        this._onRequestAnimationFrame()
      );
    }
  }

  _onRequestAnimationFrame() {
    this._requestAnimationID = null;
    if (!this._items.length && !this._pendingItem) {
      return;
    }

    const now = performance.now();
    const timePassed = now - this._lastUpdateTime;
    if (this._rate) {
      this._scheduleRender();
    }
    this._rendering = true;
    const shiftAmount = this._rate * (timePassed / 1000);
    this._containerSize = size(this._$container, this._direction);
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
        if (
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

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowResized =
      windowWidth !== this._windowWidth || windowHeight !== this._windowHeight;
    this._windowWidth = windowWidth;
    this._windowHeight = windowHeight;

    offsets.forEach((offset, i) => {
      const item = this._items[i];
      const hasJumped = item.offset + shiftAmount !== offset;
      item.item.setOffset(offset, this._rate, windowResized || hasJumped);
      item.offset = offset;
    });
    this._updateContainerSize();

    if (!this._items.length) {
      this._leftItemOffset = 0;
      defer(() => {
        this._onAllItemsRemoved.forEach((cb) => {
          deferException(() => cb());
        });
      });
    }

    this._nextItemImmediatelyFollowsPrevious = false;
    const justReversedRate = this._justReversedRate;
    this._justReversedRate = false;

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
