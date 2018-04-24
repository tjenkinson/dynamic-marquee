import { DIRECTION } from './direction.js';
import { size } from './helpers.js';

export class Item {
  constructor($el, direction) {
    const $container = document.createElement('div');
    $container.style.display = 'block';
    $container.style.position = 'absolute';
    $container.style.margin = '0';
    $container.style.padding = '0';
    $container.style[this._direction === DIRECTION.RIGHT ? 'top' : 'left'] = '0';
    $container.style.whiteSpace = 'nowrap';
    $container.style.willChange = 'auto';
    $container.appendChild($el);

    this._$container = $container;
    this._$el = $el;
    this._direction = direction;
  }
  getSize({ inverse = false } = {}) {
    let dir = this._direction;
    if (inverse) {
      dir = dir === DIRECTION.RIGHT ? DIRECTION.DOWN : DIRECTION.RIGHT;
    }
    return size(this._$container, dir);
  }
  setOffset(offset) {
    if (this._direction === DIRECTION.RIGHT) {
      this._$container.style.transform = `translateX(${offset}px)`;
    } else {
      this._$container.style.transform = `translateY(${offset}px)`;
    }
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
  getSize() {
    return this._size;
  }
  setOffset() {}
  enableAnimationHint() {}
  remove() {}
}