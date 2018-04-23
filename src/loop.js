import { toDomEl } from './helpers.js';

export function loop(marquee, buildersIn=[], seperatorBuilder=null) {
  let lastIndex = -1;
  let builders = buildersIn.slice();
  const appendItem = (spaceJustAvailable) => {
    if (!builders.length || !marquee.isWaitingForItem()) {
      return;
    }
    lastIndex = (lastIndex+1) % builders.length;
    let $item = toDomEl(builders[lastIndex]());
    if (spaceJustAvailable && seperatorBuilder) {
      const $seperator = toDomEl(seperatorBuilder());
      const $container = document.createElement('div');
      $seperator.style.display = 'inline';
      $item.style.display = 'inline';
      $container.appendChild($seperator);
      $container.appendChild($item);
      $item = $container;
    }
    marquee.appendItem($item);
  };
  marquee.onItemRequired(() => appendItem(true));
  appendItem();
  return {
    update: (newBuilders) => {
      builders = newBuilders.slice();
      appendItem(false);
    }
  };
}