import { Listeners } from './listeners';

export class SizeWatcher {
  constructor($el) {
    const listeners = Listeners();
    this.onSizeChange = listeners.add;
    this._$el = $el;
    this._width = null;
    this._height = null;
    this._observer =
      'ResizeObserver' in window
        ? new ResizeObserver((entries) => {
            const entry = entries[entries.length - 1];
            const size = entry.borderBoxSize[0] || entry.borderBoxSize;
            this._width = size.inlineSize;
            this._height = size.blockSize;
            listeners.invoke();
          })
        : null;

    this._observer?.observe($el);
  }
  getWidth() {
    if (this._width !== null) return this._width;

    const width = this._$el.getBoundingClientRect().width;
    if (this._observer) this._width = width;
    return width;
  }
  getHeight() {
    if (this._height !== null) return this._height;

    const height = this._$el.getBoundingClientRect().height;
    if (this._observer) this._height = height;
    return height;
  }
  tearDown() {
    this._observer?.disconnect();
    this._observer = null;
  }
}
