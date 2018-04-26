import { DIRECTION } from './direction.js';

export function size($el, direction) {
  return $el[direction === DIRECTION.RIGHT ? 'offsetWidth' : 'offsetHeight'];
}

export function defer(fn) {
  window.setTimeout(() => fn(), 0);
}

export function deferException(cb) {
  try {
    return cb();
  } catch(e) {
    defer(() => {
      throw e;
    });
  }
}

export function toDomEl($el) {
  if (typeof $el === 'string' || typeof $el === 'number') {
    // helper. convert string to div
    const $div = document.createElement('div');
    $div.textContent = $el+"";
    return $div;
  }
  return $el;
}