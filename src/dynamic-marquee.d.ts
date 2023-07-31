export as namespace DynamicMarquee;

export type Options = {
  rate?: number;
  upDown?: boolean;
  startOnScreen?: boolean;
};

export type Item = HTMLElement | string | number;

export type AppendItemConfig<TMetadata> = {
  metadata?: TMetadata;
  snapToNeighbour?: boolean;
};

export type Touching<TMetadata> = {
  $el: HTMLElement;
  metadata: TMetadata;
};

export class Marquee<TMetadata = null> {
  constructor($container: HTMLElement, options?: Options);
  onItemRequired(
    callback: (data: {
      /** @deprecated use `touching !== null` instead */
      immediatelyFollowsPrevious: boolean;
      touching: Touching<TMetadata> | null;
    }) => Item | void,
  ): void;
  onItemRemoved(callback: ($el: HTMLElement) => void): void;
  onAllItemsRemoved(callback: () => void): void;
  getNumItems(): number;
  setRate(rate: number): void;
  getRate(): number;
  clear(): void;
  isWaitingForItem(): boolean;
  appendItem(item: Item, config?: AppendItemConfig<TMetadata>): void;
  watchItemSize(item: Item): {
    getSize: () => number;
    onSizeChange: (callback: () => void) => () => void;
    stopWatching: () => void;
  };
  getGapSize(opts?: { snapToNeighbour?: boolean }): number;
}

export type LoopBuilder = () => Item;
export type LoopReturn = { update: (newBuilders: LoopBuilder[]) => void };

export function loop(
  marquee: Marquee,
  buildersIn?: LoopBuilder[],
  seperatorBuilder?: LoopBuilder | null,
): LoopReturn;
