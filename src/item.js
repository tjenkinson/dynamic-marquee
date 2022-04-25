import { DIRECTION } from './direction.js';
import { SizeWatcher } from './size-watcher.js';

export class Item {
  constructor($el, direction, metadata) {
    const $container = document.createElement('div');
    $container.style.display = 'block';
    $container.style.opacity = '0';
    $container.style.position = 'absolute';
    $container.style.margin = '0';
    $container.style.padding = '0';
    if (direction === DIRECTION.RIGHT) {
      $container.style.whiteSpace = 'nowrap';
    }
    this._sizeWatcher = new SizeWatcher($container);
    $container.appendChild($el);

    this._$container = $container;
    this._$el = $el;
    this._direction = direction;
    this._metadata = metadata;
    this._offset = null;
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
  setOffset(offset) {
    if (this._offset === offset) return;

    this._offset = offset;
    this._$container.style.opacity = '1';
    if (this._direction === DIRECTION.RIGHT) {
      this._$container.style.left = `${offset}px`;
    } else {
      this._$container.style.top = `${offset}px`;
    }
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
  getMetadata() {
    return this._metadata;
  }
}
