import { toDomEl } from './helpers.js';
import longestSubstring from 'longest-common-substring';

export function loop(marquee, buildersIn = [], seperatorBuilder = null) {
  let lastIndex = -1;
  let builders = buildersIn.slice();

  const getNextBuilder = (offset = 1) => {
    const nextIndex = (lastIndex + offset) % builders.length;
    return { builder: builders[nextIndex], index: nextIndex };
  };

  const appendItem = (touching) => {
    if (!builders.length || !marquee.isWaitingForItem()) {
      return;
    }

    if (
      seperatorBuilder &&
      touching &&
      touching.metadata?.isSeperator !== true
    ) {
      const $el = toDomEl(seperatorBuilder());
      marquee.appendItem($el, { metadata: { isSeperator: true } });
      return;
    }

    const { builder, index } = getNextBuilder();
    lastIndex = index;
    marquee.appendItem(toDomEl(builder()));
  };

  marquee.onItemRequired(({ touching }) => appendItem(touching));

  appendItem();

  return {
    update: (newBuilders) => {
      // try and start from somewhere that makes sense
      const calculateNewIndex = () => {
        // convert array of function references to array of ids
        const buildersStructure = builders.map((b, i) => {
          const prevIndex = builders.indexOf(b);
          // if already seen builder, give it the same number
          return prevIndex < i ? prevIndex : i;
        });
        const newBuildersStructure = newBuilders.map((b) => {
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
    },
  };
}
