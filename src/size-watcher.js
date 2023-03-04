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
    // ignore the cached result if it is 0 because we get notified of the new size async, and it might
    // have content and not actually be 0 anymore. Treating 0 as a special case because being wrong with 0 is
    // generally worse than having an actual value
    if (this._width !== null && this._width !== 0) return this._width;

    // maps to `inlineSize`
    const width = pxStringToValue(window.getComputedStyle(this._$el).width);
    if (this._observer) this._width = width;
    return width;
  }
  getHeight() {
    // see comment above for why !== 0
    if (this._height !== null && this._height !== 0) return this._height;

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
