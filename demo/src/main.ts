import './style.css';
import { Marquee, LoopReturn } from 'dynamic-marquee';

declare global {
  interface Window {
    m?: Marquee;
    l?: LoopReturn;
  }
}

const $marquee = document.getElementById('marquee')!;

const marquee = (window.m = new Marquee($marquee, {
  rate: -100,
  // rate: -500,
}));

marquee.appendItem(
  'testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest'.repeat(
    1,
  ),
);
