import { DIRECTION } from './direction.js';
import { SizeWatcher } from './size-watcher.js';

const transitionDuration = 60000;

export class Item {
  constructor($el, direction) {
    const $container = document.createElement('div');
    $container.style.display = 'block';
    $container.style.position = 'absolute';
    $container.style.margin = '0';
    $container.style.padding = '0';
    if (direction === DIRECTION.RIGHT) {
      $container.style.whiteSpace = 'nowrap';
    }
    $container.style.willChange = 'auto';
    this._sizeWatcher = new SizeWatcher($container);
    $container.appendChild($el);

    this._$container = $container;
    this._$el = $el;
    this._direction = direction;
    this._transitionState = null;
  }
  getSize({ inverse = false } = {}) {
    let dir = this._direction;
    if (inverse) {
      dir = dir === DIRECTION.RIGHT ? DIRECTION.DOWN : DIRECTION.RIGHT;
    }
    return dir === DIRECTION.RIGHT
      ? this._sizeWatcher.getWidth()
      : this._sizeWatcher.getHeight();
  }
  setOffset(offset, rate, force) {
    const transitionState = this._transitionState;
    const rateChanged = !transitionState || transitionState.rate !== rate;
    if (transitionState && !force) {
      const timePassed = performance.now() - transitionState.time;
      if (timePassed < transitionDuration - 10000 && !rateChanged) {
        return;
      }
    }

    if (force || rateChanged) {
      if (this._direction === DIRECTION.RIGHT) {
        this._$container.style.transform = `translateX(${offset}px)`;
      } else {
        this._$container.style.transform = `translateY(${offset}px)`;
      }

      this._$container.style.transition = '';
      this._$container.offsetLeft;
    }

    const futureOffset = offset + (rate / 1000) * transitionDuration;
    if (this._direction === DIRECTION.RIGHT) {
      this._$container.style.transform = `translateX(${futureOffset}px)`;
    } else {
      this._$container.style.transform = `translateY(${futureOffset}px)`;
    }

    if (rate) {
      this._$container.style.transition = `transform ${transitionDuration}ms linear`;
    }

    this._transitionState = {
      time: performance.now(),
      rate,
    };
  }
  enableAnimationHint(enable) {
    this._$container.style.willChange = enable ? 'transform' : 'auto';
  }
  remove() {
    this._sizeWatcher.tearDown();
    this._$container.parentNode.removeChild(this._$container);
  }
  getContainer() {
    return this._$container;
  }
  getOriginalEl() {
    return this._$el;
  }
}

export class VirtualItem {
  constructor(size) {
    this._size = size;
  }
  getSize({ inverse = false } = {}) {
    if (inverse) {
      throw new Error('Inverse not supported on virtual item.');
    }
    return this._size;
  }
  setOffset() {}
  enableAnimationHint() {}
  remove() {}
}
