import { toDomEl } from './helpers.js';
import longestSubstring from 'longest-common-substring';

export function loop(marquee, buildersIn = [], seperatorBuilder = null) {
  let lastIndex = -1;
  let builders = buildersIn.slice();

  const getNextBuilder = (offset = 1) => {
    const nextIndex = (lastIndex + offset) % builders.length;
    return { builder: builders[nextIndex], index: nextIndex };
  };

  const appendItem = immediatelyFollowsPrevious => {
    if (!builders.length || !marquee.isWaitingForItem()) {
      return;
    }
    const { builder, index } = getNextBuilder();
    lastIndex = index;
    let $item = toDomEl(builder());
    if (immediatelyFollowsPrevious && seperatorBuilder) {
      const $seperator = toDomEl(seperatorBuilder());
      const $container = document.createElement('div');
      $seperator.style.display = 'inline';
      $item.style.display = 'inline';
      if (marquee.getRate() <= 0) {
        $container.appendChild($seperator);
        $container.appendChild($item);
      } else {
        $container.appendChild($item);
        $container.appendChild($seperator);
      }
      $item = $container;
    }
    marquee.appendItem($item);
  };
  marquee.onItemRequired(({ immediatelyFollowsPrevious }) =>
    appendItem(immediatelyFollowsPrevious)
  );
  appendItem();
  return {
    update: newBuilders => {
      // try and start from somewhere that makes sense
      const calculateNewIndex = () => {
        // convert array of function references to array of ids
        const buildersStructure = builders.map((b, i) => {
          const prevIndex = builders.indexOf(b);
          // if already seen builder, give it the same number
          return prevIndex < i ? prevIndex : i;
        });
        const newBuildersStructure = newBuilders.map((b, i) => {
          // matching indexes where they exist, and -1 for all unknown
          return builders.indexOf(b);
        });

        const { startString1, startString2, length } = longestSubstring(
          buildersStructure,
          newBuildersStructure
        );
        if (lastIndex >= startString1 && lastIndex < startString1 + length) {
          // we are in the overlapping region
          return lastIndex + (startString2 - startString1);
        }
        return -1;
      };

      lastIndex = calculateNewIndex();
      builders = newBuilders.slice();
      appendItem(false);
    }
  };
}
