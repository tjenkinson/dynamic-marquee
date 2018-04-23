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
      upDown = false
    } = {}
  ) {
    this._waitingForItem = true;
    this._rate = rate;
    this._direction = upDown ? DIRECTION.DOWN : DIRECTION.RIGHT;
    this._onItemRequired = [];
    this._onItemRemoved = [];
    this._onAllItemsRemoved = [];
    this._leftItemOffset = 0;
    this._items = [];
    this._pendingItem = null;
    const $innerContainer = document.createElement('div');
    $innerContainer.style.position = 'relative';
    $innerContainer.style.width = '100%';
    $innerContainer.style.height = '100%';
    this._$container = $innerContainer;
    $container.appendChild($innerContainer);
    this._lastUpdateTime = performance.now();
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
    return this._items.filter((item) => item instanceof Item).length;
  }

  setRate(rate) {
    if (!rate !== !this._rate) {
      this._enableAnimationHint(!!rate);
      if (rate) {
        this._scheduleRender();
      }
    }
    this._rate = rate;
  }

  clear() {
    this._items.forEach(($a) => this._removeItem($a));
    this._items = [];
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
    const itemAlreadyExists = this._items.some((item) => {
      return (item instanceof Item) && item.getOriginalEl() === $el;
    });
    if (itemAlreadyExists) {
      throw new Error('Item already exists.');
    }
    this._waitingForItem = false;
    this._pendingItem = new Item($el, this._direction);
    this._pendingItem.enableAnimationHint(!!this._rate);
    this._scheduleRender();
  }

  _removeItem(item) {
    item.remove();
    if (item instanceof Item) {
      defer(() => {
        this._onItemRemoved.forEach((cb) => {
          deferException(() => cb(item.getOriginalEl()));
        });
      });
    }
  }

  _enableAnimationHint(enable) {
    this._items.forEach((item) => item.enableAnimationHint(enable));
  }

  _scheduleRender() {
    if (!this._requestAnimationID) {
      this._lastUpdateTime = performance.now();
      this._requestAnimationID = window.requestAnimationFrame(() => this._render());
    }
  }

  _render() {
    this._requestAnimationID = null;
    if (!this._rate || (!this._items.length && !this._pendingItem)) {
      return;
    }
    
    const now = performance.now();
    const timePassed = now - this._lastUpdateTime;
    this._scheduleRender();
    const shiftAmount = this._rate * (timePassed / 1000);
    this._leftItemOffset += shiftAmount;
    const containerSize = size(this._$container, this._direction);

    if (this._rate < 0) {
      while(this._items.length) {
        const item = this._items[0];
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
    this._items.some((item, i) => {
      if (nextOffset >= containerSize) {
        if (this._rate > 0) {
          this._items.splice(i).forEach((a) => this._removeItem(a));
        }
        return true;
      }
      offsets.push(nextOffset);
      nextOffset += item.getSize();
      return false;
    });

    if (this._pendingItem) {
      if (!this._items.length) {
        this._leftItemOffset = 0;
      }
      this._$container.appendChild(this._pendingItem.getContainer());
      if (this._rate <= 0) {
        // insert virtual item so that it starts off screen
        this._items.push(new VirtualItem(Math.max(0, containerSize - nextOffset)));
        offsets.push(nextOffset);
        nextOffset = containerSize + this._pendingItem.getSize();
        offsets.push(containerSize);
        this._items.push(this._pendingItem);
      } else {
        if (this._items.length && this._leftItemOffset > 0) {
          this._items.unshift(new VirtualItem(this._leftItemOffset));
          offsets.unshift(0);
          this._leftItemOffset = 0;
        }
        this._leftItemOffset -= this._pendingItem.getSize();
        offsets.unshift(this._leftItemOffset);
        this._items.unshift(this._pendingItem);
      }
      this._pendingItem = null;
    }

    // trim virtual items
    while (this._items[0] instanceof VirtualItem) {
      offsets.shift();
      this._items.shift();
      this._leftItemOffset = offsets[0] || 0;
    }
    while (this._items[this._items.length-1] instanceof VirtualItem) {
      offsets.pop();
      this._items.pop();
    }

    offsets.forEach((offset, i) => this._items[i].setOffset(offset));

    if (!this._items.length) {
      defer(() => {
        this._onAllItemsRemoved.forEach((cb) => {
          deferException(() => cb());
        });
      });
    }
    
    if (
      !this._waitingForItem && (
        (this._rate <= 0 && nextOffset <= containerSize) || 
        (this._rate > 0 && this._leftItemOffset >= 0)
      )
    ) {
      this._waitingForItem = true;
      // timer to not block rendering
      defer(() => {
        if (this._waitingForItem) {
          let nextItem;
          this._onItemRequired.some((cb) => {
            return deferException(() => {
              nextItem = cb();
              return !!nextItem;
            });
          });
          if (nextItem) {
            this.appendItem(nextItem);
          }
        }
      });
    }
  }
}