export as namespace DynamicMarquee;

export type Options = {
  rate?: number;
  upDown?: boolean;
  startOnScreen?: boolean;
};

export type Item = HTMLElement | string | number;

export class Marquee {
  constructor($container: HTMLElement, options?: Options);
  onItemRequired(
    callback: (data: { immediatelyFollowsPrevious: boolean }) => Item | void
  ): void;
  onItemRemoved(callback: ($el: HTMLElement) => void): void;
  onAllItemsRemoved(callback: () => void): void;
  getNumItems(): number;
  setRate(rate: number): void;
  getRate(): number;
  clear(): void;
  isWaitingForItem(): boolean;
  appendItem($el: Item): void;
}

export type LoopBuilder = () => Item;
export type LoopReturn = { update: (newBuilders: LoopBuilder[]) => void };

export function loop(
  marquee: Marquee,
  buildersIn?: LoopBuilder[],
  seperatorBuilder?: LoopBuilder | null
): LoopReturn;
