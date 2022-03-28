export class SizeWatcher {
  constructor($el) {
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
          })
        : null;
    this._observer?.observe($el);
  }
  getWidth() {
    return this._width ?? this._$el.offsetWidth;
  }
  getHeight() {
    return this._height ?? this._$el.offsetHeight;
  }
  tearDown() {
    this._observer?.disconnect();
  }
}
