const PX_REGEX = /px$/;

function pxStringToValue(input) {
  if (!PX_REGEX.test(input)) {
    throw new Error('String missing `px` suffix');
  }
  return parseFloat(input.slice(0, -2));
}

export class SizeWatcher {
  constructor($el, onChange) {
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
            onChange();
          })
        : null;

    this._observer?.observe($el);
  }
  getWidth() {
    if (this._width !== null) return this._width;

    // maps to `inlineSize`
    const width = pxStringToValue(window.getComputedStyle(this._$el).width);
    if (this._observer) this._width = width;
    return width;
  }
  getHeight() {
    if (this._height !== null) return this._height;

    // maps to `blockSize`
    const height = pxStringToValue(window.getComputedStyle(this._$el).height);
    if (this._observer) this._height = height;
    return height;
  }
  tearDown() {
    this._observer?.disconnect();
    this._observer = null;
  }
}
