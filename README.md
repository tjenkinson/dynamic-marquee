# Dynamic Marquee

A small library for creating marquees.

Features:

- You can change the rate on the fly.
- Direction can either be up/down or right/left.
- Width/height of items and container is allowed to change.
- Container width/height is updated correctly to match maximum size of current items.
- You can add an item at any time when space is available, and it will start off screen.

A [`loop()`](#loop) helper function is also provided which makes creating a carousel with looping content simple.

# Demo

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/tjenkinson/dynamic-marquee/tree/master/demo?title=Dynamic%20Marquee%20Demo)

View the code in "[demo](./demo)".

# Installation

```
npm install --save dynamic-marquee
```

```js
import { Marquee } from 'dynamic-marquee';
```

or

```html
<script
  type="text/javascript"
  src="https://cdn.jsdelivr.net/npm/dynamic-marquee@2"
></script>

<script type="text/javascript">
  const Marquee = dynamicMarquee.Marquee;
</script>
```

thanks to [jsDelivr](https://github.com/jsdelivr/jsdelivr).

# Usage

## Construct Marquee Instance

### With Default Options

```js
const marquee = new Marquee(document.getElementById('marquee'));
```

### With Custom Options

```js
const marquee = new Marquee(document.getElementById('marquee'), {
  rate: 20, // 20 pixels/s downwards
  upDown: true, // downwards instead of to the right
  startOnScreen: false, // start on screen
});
```

## Append Item

You can add DOM elements, or just a string (which will automatically be wrapped in a div).

**Each DOM element is only allowed on the marquee at one time.**

```js
const $item = document.createElement('div');
$item.textContent = 'testing123';
marquee.appendItem($item);
```

You are only allowed to append an item when there is room. You can check this like so:

```js
if (marquee.isWaitingForItem()) {
  marquee.appendItem($item);
}
```

`appendItem` also takes an optional second param `config` object, which can contain:

- `metadata`: The value of this will be provided back to you in `onItemRequired`.
- `snapToNeighbour`: If `true` the item will snap to the end of the neighbouring item instead of starting off screen.

You can be notified when an item is required with

```js
marquee.onItemRequired(({ touching }) => {
  // For convenience if you have an item ready to go you can just return it
  // in place of `marquee.appendItem($item);`

  // If the new item would be touching another then `touching`
  // will be set to an object that contains `$el` and `metadata` of
  // the item it will be touching.
  // This can be used to determine if a separate should be added.
  // See loop.js for an example.
  return $item;
});
```

**Do not perform any long running tasks in this method as it will block rendering.**

If you need to perform some work in this method consider wrapping it in a `setTimeout` with delay 0.

## Change the scroll rate? (px/s)

You can change the rate at any time, and set to 0 to pause.

```js
marquee.setRate(-20);
```

Note if you change the direction, `isWaitingForItem()` will change to `false`, and `onItemRequired()` will be called again when needed.

## Reset

To remove all items call

```js
marquee.clear();
```

You should also call this before removing the marquee from the DOM if you no longer need it to ensure that all timers are cleaned up and garbage collection can occur.

## When has an item been removed?

You can be notified when an item has been removed with:

```js
marquee.onItemRemoved(($el) => {
  // $el has just been removed
});
```

## When have all items finished scrolling?

You can be notified when the scroller is empty with:

```js
marquee.onAllItemsRemoved(() => {
  //
});
```

You can check at any time with:

```js
marquee.getNumItems();
```

# Loop

A `loop()` function is provided for making looping content simple.

You provide an array of functions which return a DOM element, or string for that item. You can update this on the fly by calling the provided `update()` method.

**When returning DOM elements each function should build the element from scratch, as the same DOM element is not allowed to appear on the marquee multiple times.**

```js
const $marquee = document.getElementById('marquee');
const marquee = new Marquee($marquee);
const control = loop(marquee, [() => 'item 1', () => 'item 2']);

// later
control.update([() => 'new item 1', () => 'new item 2']);
```
