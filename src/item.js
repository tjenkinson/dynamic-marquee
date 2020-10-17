import { DIRECTION } from './direction.js';
import { size } from './helpers.js';

const transitionDuration = 60000;

export class Item {
  constructor($el, direction) {
    const $container = document.createElement('div');
    $container.style.display = 'block';
    $container.style.position = 'absolute';
    $container.style.margin = '0';
    $container.style.padding = '0';
    $container.style.whiteSpace = 'nowrap';
    $container.style.willChange = 'auto';
    $container.appendChild($el);

    this._$container = $container;
    this._$el = $el;
    this._direction = direction;
    this._transitionState = {
      time: performance.now(),
      offset: 0,
      rate: 0,
    };
  }
  _calculateOffset() {
    const transitionState = this._transitionState;
    const timePassed = performance.now() - transitionState.time;
    return transitionState.offset + timePassed * (transitionState.rate / 1000);
  }
  getSize({ inverse = false } = {}) {
    let dir = this._direction;
    if (inverse) {
      dir = dir === DIRECTION.RIGHT ? DIRECTION.DOWN : DIRECTION.RIGHT;
    }
    return size(this._$container, dir);
  }
  setOffset(offset, rate, force) {
    const transitionState = this._transitionState;

    const timePassed = performance.now() - transitionState.time;
    const offsetNow = this._calculateOffset();
    const inSync =
      rate === transitionState.rate && Math.abs(offsetNow - offset) < 4;

    if (!force && timePassed < transitionDuration - 10000 && inSync) {
      return;
    }

    if (!inSync || force) {
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
    this._$container.style.transition = `transform ${transitionDuration}ms linear`;

    this._transitionState = {
      time: performance.now(),
      offset,
      rate,
    };
  }
  enableAnimationHint(enable) {
    this._$container.style.willChange = enable ? 'transform' : 'auto';
  }
  remove() {
    this._$container.remove();
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
