export function defer(fn) {
  window.setTimeout(() => fn(), 0);
}

export function deferException(cb) {
  try {
    return cb();
  } catch (e) {
    defer(() => {
      throw e;
    });
  }
}

export function toDomEl($el) {
  if (typeof $el === 'string' || typeof $el === 'number') {
    // helper. convert string to div
    const $div = document.createElement('div');
    $div.textContent = $el + '';
    return $div;
  }
  return $el;
}

export function last(input) {
  return input.length ? input[input.length - 1] : null;
}

export function first(input) {
  return input.length ? input[0] : null;
}
