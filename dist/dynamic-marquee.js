(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["dynamicMarquee"] = factory();
	else
		root["dynamicMarquee"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.size = size;
exports.defer = defer;
exports.deferException = deferException;
exports.toDomEl = toDomEl;

var _direction = __webpack_require__(1);

function size($el, direction) {
  return $el[direction === _direction.DIRECTION.RIGHT ? 'offsetWidth' : 'offsetHeight'];
}

function defer(fn) {
  window.setTimeout(function () {
    return fn();
  }, 0);
}

function deferException(cb) {
  try {
    return cb();
  } catch (e) {
    defer(function () {
      throw e;
    });
  }
}

function toDomEl($el) {
  if (typeof $el === 'string' || typeof $el === 'number') {
    // helper. convert string to div
    var $div = document.createElement('div');
    $div.textContent = $el + "";
    return $div;
  }
  return $el;
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var DIRECTION = exports.DIRECTION = {
  RIGHT: 'right',
  DOWN: 'down'
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var indexMap = function indexMap(list) {
  var map = {};
  list.forEach(function (each, i) {
    map[each] = map[each] || [];
    map[each].push(i);
  });
  return map;
};

var longestCommonSubstring = function longestCommonSubstring(seq1, seq2) {
  var result = { startString1: 0, startString2: 0, length: 0 };
  var indexMapBefore = indexMap(seq1);
  var previousOverlap = [];
  seq2.forEach(function (eachAfter, indexAfter) {
    var overlapLength;
    var overlap = [];
    var indexesBefore = indexMapBefore[eachAfter] || [];
    indexesBefore.forEach(function (indexBefore) {
      overlapLength = (indexBefore && previousOverlap[indexBefore - 1] || 0) + 1;
      if (overlapLength > result.length) {
        result.length = overlapLength;
        result.startString1 = indexBefore - overlapLength + 1;
        result.startString2 = indexAfter - overlapLength + 1;
      }
      overlap[indexBefore] = overlapLength;
    });
    previousOverlap = overlap;
  });
  return result;
};

module.exports = longestCommonSubstring;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loop = loop;

var _helpers = __webpack_require__(0);

var _longestCommonSubstring = __webpack_require__(2);

var _longestCommonSubstring2 = _interopRequireDefault(_longestCommonSubstring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function loop(marquee) {
  var buildersIn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var seperatorBuilder = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  var lastIndex = -1;
  var builders = buildersIn.slice();

  var getNextBuilder = function getNextBuilder() {
    var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    var nextIndex = (lastIndex + offset) % builders.length;
    return { builder: builders[nextIndex], index: nextIndex };
  };

  var appendItem = function appendItem(immediatelyFollowsPrevious) {
    if (!builders.length || !marquee.isWaitingForItem()) {
      return;
    }

    var _getNextBuilder = getNextBuilder(),
        builder = _getNextBuilder.builder,
        index = _getNextBuilder.index;

    lastIndex = index;
    var $item = (0, _helpers.toDomEl)(builder());
    if (immediatelyFollowsPrevious && seperatorBuilder) {
      var $seperator = (0, _helpers.toDomEl)(seperatorBuilder());
      var $container = document.createElement('div');
      $seperator.style.display = 'inline';
      $item.style.display = 'inline';
      $container.appendChild($seperator);
      $container.appendChild($item);
      $item = $container;
    }
    marquee.appendItem($item);
  };
  marquee.onItemRequired(function (_ref) {
    var immediatelyFollowsPrevious = _ref.immediatelyFollowsPrevious;
    return appendItem(immediatelyFollowsPrevious);
  });
  appendItem();
  return {
    update: function update(newBuilders) {

      // try and start from somewhere that makes sense
      var calculateNewIndex = function calculateNewIndex() {
        // convert array of function references to array of ids
        var buildersStructure = builders.map(function (b, i) {
          var prevIndex = builders.indexOf(b);
          // if already seen builder, give it the same number
          return prevIndex < i ? prevIndex : i;
        });
        var newBuildersStructure = newBuilders.map(function (b, i) {
          // matching indexes where they exist, and -1 for all unknown
          return builders.indexOf(b);
        });

        var _longestSubstring = (0, _longestCommonSubstring2.default)(buildersStructure, newBuildersStructure),
            startString1 = _longestSubstring.startString1,
            startString2 = _longestSubstring.startString2,
            length = _longestSubstring.length;

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

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VirtualItem = exports.Item = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _direction = __webpack_require__(1);

var _helpers = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Item = exports.Item = function () {
  function Item($el, direction) {
    _classCallCheck(this, Item);

    var $container = document.createElement('div');
    $container.style.display = 'block';
    $container.style.position = 'absolute';
    $container.style.margin = '0';
    $container.style.padding = '0';
    $container.style[this._direction === _direction.DIRECTION.RIGHT ? 'top' : 'left'] = '0';
    $container.style.whiteSpace = 'nowrap';
    $container.style.willChange = 'auto';
    $container.appendChild($el);

    this._$container = $container;
    this._$el = $el;
    this._direction = direction;
  }

  _createClass(Item, [{
    key: 'getSize',
    value: function getSize() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$inverse = _ref.inverse,
          inverse = _ref$inverse === undefined ? false : _ref$inverse;

      var dir = this._direction;
      if (inverse) {
        dir = dir === _direction.DIRECTION.RIGHT ? _direction.DIRECTION.DOWN : _direction.DIRECTION.RIGHT;
      }
      return (0, _helpers.size)(this._$container, dir);
    }
  }, {
    key: 'setOffset',
    value: function setOffset(offset) {
      if (this._direction === _direction.DIRECTION.RIGHT) {
        this._$container.style.transform = 'translateX(' + offset + 'px)';
      } else {
        this._$container.style.transform = 'translateY(' + offset + 'px)';
      }
    }
  }, {
    key: 'enableAnimationHint',
    value: function enableAnimationHint(enable) {
      this._$container.style.willChange = enable ? 'transform' : 'auto';
    }
  }, {
    key: 'remove',
    value: function remove() {
      this._$container.remove();
    }
  }, {
    key: 'getContainer',
    value: function getContainer() {
      return this._$container;
    }
  }, {
    key: 'getOriginalEl',
    value: function getOriginalEl() {
      return this._$el;
    }
  }]);

  return Item;
}();

var VirtualItem = exports.VirtualItem = function () {
  function VirtualItem(size) {
    _classCallCheck(this, VirtualItem);

    this._size = size;
  }

  _createClass(VirtualItem, [{
    key: 'getSize',
    value: function getSize() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$inverse = _ref2.inverse,
          inverse = _ref2$inverse === undefined ? false : _ref2$inverse;

      if (inverse) {
        throw new Error('Inverse not supported on virtual item.');
      }
      return this._size;
    }
  }, {
    key: 'setOffset',
    value: function setOffset() {}
  }, {
    key: 'enableAnimationHint',
    value: function enableAnimationHint() {}
  }, {
    key: 'remove',
    value: function remove() {}
  }]);

  return VirtualItem;
}();

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Marquee = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _item = __webpack_require__(4);

var _direction = __webpack_require__(1);

var _helpers = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Marquee = exports.Marquee = function () {
  function Marquee($container) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$rate = _ref.rate,
        rate = _ref$rate === undefined ? -25 : _ref$rate,
        _ref$upDown = _ref.upDown,
        upDown = _ref$upDown === undefined ? false : _ref$upDown;

    _classCallCheck(this, Marquee);

    this._rendering = false;
    this._waitingForItem = true;
    this._nextItemImmediatelyFollowsPrevious = false;
    this._rate = rate;
    this._direction = upDown ? _direction.DIRECTION.DOWN : _direction.DIRECTION.RIGHT;
    this._onItemRequired = [];
    this._onItemRemoved = [];
    this._onAllItemsRemoved = [];
    this._leftItemOffset = 0;
    this._containerSize = 0;
    this._items = [];
    this._pendingItem = null;
    var $innerContainer = document.createElement('div');
    $innerContainer.style.position = 'relative';
    $innerContainer.style.display = 'inline-block';
    this._$container = $innerContainer;
    this._containerSizeInverse = null;
    if (this._direction === _direction.DIRECTION.RIGHT) {
      $innerContainer.style.width = '100%';
    } else {
      $innerContainer.style.height = '100%';
    }
    this._updateContainerSize();
    $container.appendChild($innerContainer);
    this._scheduleRender();
  }

  // called when there's room for a new item.
  // You can return the item to append next


  _createClass(Marquee, [{
    key: 'onItemRequired',
    value: function onItemRequired(cb) {
      this._onItemRequired.push(cb);
    }

    // Called when an item is removed

  }, {
    key: 'onItemRemoved',
    value: function onItemRemoved(cb) {
      this._onItemRemoved.push(cb);
    }

    // Called when the last item is removed

  }, {
    key: 'onAllItemsRemoved',
    value: function onAllItemsRemoved(cb) {
      this._onAllItemsRemoved.push(cb);
    }
  }, {
    key: 'getNumItems',
    value: function getNumItems() {
      return this._items.filter(function (item) {
        return item instanceof _item.Item;
      }).length;
    }
  }, {
    key: 'setRate',
    value: function setRate(rate) {
      if (!rate !== !this._rate) {
        this._enableAnimationHint(!!rate);
        if (rate) {
          this._scheduleRender();
        }
      }
      this._rate = rate;
    }
  }, {
    key: 'clear',
    value: function clear() {
      var _this = this;

      this._items.forEach(function ($a) {
        return _this._removeItem($a);
      });
      this._items = [];
    }
  }, {
    key: 'isWaitingForItem',
    value: function isWaitingForItem() {
      return this._waitingForItem;
    }
  }, {
    key: 'appendItem',
    value: function appendItem($el) {
      if (!this._waitingForItem) {
        throw new Error('No room for item.');
      }
      // convert to div if $el is a string
      $el = (0, _helpers.toDomEl)($el);
      var itemAlreadyExists = this._items.some(function (item) {
        return item instanceof _item.Item && item.getOriginalEl() === $el;
      });
      if (itemAlreadyExists) {
        throw new Error('Item already exists.');
      }
      this._waitingForItem = false;
      this._pendingItem = new _item.Item($el, this._direction);
      this._pendingItem.enableAnimationHint(!!this._rate);
      this._scheduleRender();
    }
  }, {
    key: '_removeItem',
    value: function _removeItem(item) {
      var _this2 = this;

      (0, _helpers.defer)(function () {
        item.remove();
        if (item instanceof _item.Item) {
          _this2._onItemRemoved.forEach(function (cb) {
            (0, _helpers.deferException)(function () {
              return cb(item.getOriginalEl());
            });
          });
        }
      });
    }

    // update size of container so that the marquee items fit inside it.
    // This is needed because the items are posisitioned absolutely, so not in normal flow.
    // Without this, the height of the container would always be 0px, which is not useful

  }, {
    key: '_updateContainerSize',
    value: function _updateContainerSize() {
      var maxSize = this._items.reduce(function (size, item) {
        if (item instanceof _item.VirtualItem) {
          return size;
        }
        var a = item.getSize({ inverse: true });
        if (a > size) {
          return a;
        }
        return size;
      }, 0);
      if (this._containerSizeInverse !== maxSize) {
        this._containerSizeInverse = maxSize;
        if (this._direction === _direction.DIRECTION.RIGHT) {
          this._$container.style.height = maxSize + 'px';
        } else {
          this._$container.style.width = maxSize + 'px';
        }
      }
    }
  }, {
    key: '_enableAnimationHint',
    value: function _enableAnimationHint(enable) {
      this._items.forEach(function (item) {
        return item.enableAnimationHint(enable);
      });
    }
  }, {
    key: '_scheduleRender',
    value: function _scheduleRender() {
      var _this3 = this;

      if (this._rendering) {
        // we are already rendering, so call the render method synchronously
        this._render();
      } else {
        if (!this._requestAnimationID) {
          this._lastUpdateTime = performance.now();
          this._requestAnimationID = window.requestAnimationFrame(function () {
            return _this3._onRequestAnimationFrame();
          });
        }
      }
    }
  }, {
    key: '_onRequestAnimationFrame',
    value: function _onRequestAnimationFrame() {
      var _this4 = this;

      this._requestAnimationID = null;
      if (!this._rate || !this._items.length && !this._pendingItem) {
        return;
      }

      var now = performance.now();
      var timePassed = now - this._lastUpdateTime;
      this._scheduleRender();
      this._rendering = true;
      var shiftAmount = this._rate * (timePassed / 1000);
      this._leftItemOffset += shiftAmount;
      this._containerSize = (0, _helpers.size)(this._$container, this._direction);
      (0, _helpers.deferException)(function () {
        return _this4._render();
      });
      this._rendering = false;
    }
  }, {
    key: '_render',
    value: function _render() {
      var _this5 = this;

      var containerSize = this._containerSize;
      if (this._rate < 0) {
        while (this._items.length) {
          var item = this._items[0];
          var _size = item.getSize();
          if (this._leftItemOffset + _size > 0) {
            break;
          }
          this._removeItem(this._items[0]);
          this._items.shift();
          this._leftItemOffset += _size;
        }
      }

      var offsets = [];
      var nextOffset = this._leftItemOffset;
      this._items.some(function (item, i) {
        if (nextOffset >= containerSize) {
          if (_this5._rate > 0) {
            _this5._items.splice(i).forEach(function (a) {
              return _this5._removeItem(a);
            });
          }
          return true;
        }
        offsets.push(nextOffset);
        nextOffset += item.getSize();
        return false;
      });

      if (this._pendingItem) {
        this._$container.appendChild(this._pendingItem.getContainer());
        if (this._rate <= 0) {
          if (!this._nextItemImmediatelyFollowsPrevious) {
            // insert virtual item so that it starts off screen
            this._items.push(new _item.VirtualItem(Math.max(0, containerSize - nextOffset)));
            offsets.push(nextOffset);
            nextOffset = containerSize;
          }
          offsets.push(nextOffset);
          nextOffset += this._pendingItem.getSize();
          this._items.push(this._pendingItem);
        } else {
          if (!this._nextItemImmediatelyFollowsPrevious && this._items.length && this._leftItemOffset > 0) {
            this._items.unshift(new _item.VirtualItem(this._leftItemOffset));
            offsets.unshift(0);
            this._leftItemOffset = 0;
          }
          this._leftItemOffset -= this._pendingItem.getSize();
          offsets.unshift(this._leftItemOffset);
          this._items.unshift(this._pendingItem);
        }
        this._pendingItem = null;
      }

      // trim virtual items
      while (this._items[0] instanceof _item.VirtualItem) {
        offsets.shift();
        this._items.shift();
        this._leftItemOffset = offsets[0] || 0;
      }
      while (this._items[this._items.length - 1] instanceof _item.VirtualItem) {
        offsets.pop();
        this._items.pop();
      }

      offsets.forEach(function (offset, i) {
        return _this5._items[i].setOffset(offset);
      });
      this._updateContainerSize();

      if (!this._items.length) {
        this._leftItemOffset = 0;
        (0, _helpers.defer)(function () {
          _this5._onAllItemsRemoved.forEach(function (cb) {
            (0, _helpers.deferException)(function () {
              return cb();
            });
          });
        });
      }

      this._nextItemImmediatelyFollowsPrevious = false;
      if (!this._waitingForItem && (this._rate <= 0 && nextOffset <= containerSize || this._rate > 0 && this._leftItemOffset >= 0)) {
        this._waitingForItem = true;
        // if all items have been cleared then make the next item start offscreen
        var nextItemImmediatelyFollowsPrevious = this._nextItemImmediatelyFollowsPrevious = !!this._items.length;
        var nextItem = void 0;
        this._onItemRequired.some(function (cb) {
          return (0, _helpers.deferException)(function () {
            nextItem = cb({ immediatelyFollowsPrevious: nextItemImmediatelyFollowsPrevious });
            return !!nextItem;
          });
        });
        if (nextItem) {
          // Note appendItem() will call _scheduleRender(), which will synchronously call
          // _render() again
          this.appendItem(nextItem);
        }
      }
    }
  }]);

  return Marquee;
}();

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _marquee = __webpack_require__(5);

Object.defineProperty(exports, 'Marquee', {
  enumerable: true,
  get: function get() {
    return _marquee.Marquee;
  }
});

var _loop = __webpack_require__(3);

Object.defineProperty(exports, 'loop', {
  enumerable: true,
  get: function get() {
    return _loop.loop;
  }
});

/***/ })
/******/ ]);
});