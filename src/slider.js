import { DIRECTION } from './direction';

const transitionDuration = 30000;

export class Slider {
  constructor($el, direction) {
    this._$el = $el;
    this._direction = direction;
    this._transitionState = null;
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
        this._$el.style.transform = `translateX(${offset}px)`;
      } else {
        this._$el.style.transform = `translateY(${offset}px)`;
      }

      this._$el.style.transition = 'none';
      this._$el.offsetLeft;
    }

    if (rate && (force || rateChanged)) {
      this._$el.style.transition = `transform ${transitionDuration}ms linear`;
    }

    if (rate) {
      const futureOffset = offset + (rate / 1000) * transitionDuration;
      if (this._direction === DIRECTION.RIGHT) {
        this._$el.style.transform = `translateX(${futureOffset}px)`;
      } else {
        this._$el.style.transform = `translateY(${futureOffset}px)`;
      }
    }

    this._transitionState = {
      time: performance.now(),
      rate,
    };
  }
}
