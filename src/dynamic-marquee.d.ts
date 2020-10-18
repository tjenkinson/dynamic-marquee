export as namespace DynamicMarquee;

export type Options = {
  rate?: number;
  upDown?: boolean;
};

export class Marquee {
  constructor($container: HTMLElement, options?: Options);
  onItemRequired(
    callback: (data: { immediatelyFollowsPrevious: boolean }) => void
  );
  onItemRemoved(callback: ($el: HTMLElement) => void): void;
  onAllItemsRemoved(callback: () => void): void;
  getNumItems(): number;
  setRate(rate: number): void;
  getRate(): number;
  clear(): void;
  isWaitingForItem(): boolean;
  appendItem($el: HTMLElement): void;
}
