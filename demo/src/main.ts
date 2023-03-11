import './style.css';
import { Marquee, loop, LoopReturn } from 'dynamic-marquee';

declare global {
  interface Window {
    m: Marquee;
    l: LoopReturn;
  }
}

const $marquee = document.getElementById('marquee')!;

const marquee = (window.m = new Marquee($marquee, {
  rate: -100,
}));

window.l = loop(
  marquee,
  [
    () => 'Contrary to popular belief, Lorem Ipsum is not simply random text',
    () =>
      'It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old',
    () =>
      'Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source',
    () =>
      'Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC',
  ],
  () => {
    const $separator = document.createElement('div');
    $separator.innerHTML = '&nbsp•&nbsp';
    return $separator;
  }
);
