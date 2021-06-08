(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.dataScrollAnimation = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from) {
        for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
            to[j] = from[i];
        return to;
    }

    var EXTRAPOLATE = Symbol("extrapolate");
    function computeFrames(frames) {
        var staticString = null;
        var indexes = [];
        var frameNumbers = [];
        var frameValues = [];
        var beforeValue = null;
        var afterValue = null;
        var needUpdateAt = [false, null, null, false];
        function getNearestLeftIndexOf(frameNumber) {
            if (frameNumbers.length === 0) {
                return -1;
            }
            var leftIndex = 0;
            for (var i = 1; i < frameNumbers.length; i++) {
                if (frameNumbers[i] > frameNumber) {
                    break;
                }
                leftIndex = i;
            }
            return leftIndex;
        }
        {
            var constants_1 = false;
            frames.sort(function (a, b) {
                var result;
                if (a[0] === "before") {
                    result = b[0] === "after" ? -1 : b[0] === "before" ? 0 : 1;
                }
                else if (a[0] === "after") {
                    result = b[0] === "after" ? 0 : b[0] === "before" ? 1 : -1;
                }
                else if (b[0] === "before") {
                    result = -1;
                }
                else if (b[0] === "after") {
                    result = -1;
                }
                else {
                    result = a[0] - b[0];
                }
                return result;
            });
            frames.forEach(function (frame) {
                if (frame[1] === EXTRAPOLATE) {
                    if (frame[0] !== "after" && frame[0] !== "before") {
                        frameNumbers.push(frame[0]);
                    }
                    return;
                }
                else if (frame[0] === "after") {
                    afterValue = frame[1];
                    needUpdateAt[3] = true;
                    return;
                }
                else if (frame[0] === "before") {
                    beforeValue = frame[1];
                    needUpdateAt[0] = true;
                    return;
                }
                var thisStaticString;
                frameNumbers.push(frame[0]);
                if (needUpdateAt[1] == null || needUpdateAt[1] > frame[0]) {
                    needUpdateAt[1] = frame[0];
                }
                if (needUpdateAt[2] == null || needUpdateAt[2] < frame[0]) {
                    needUpdateAt[2] = frame[0];
                }
                if (!constants_1) {
                    thisStaticString = frame[1].trim()
                        .replace(/[ ]*,[ ]*/g, ",")
                        .replace(/(?:\([ ]+)/g, "(")
                        .replace(/(?:\)[ ]+(?= \w))/g, ") ")
                        .replace(/(?:\)[ ]{2,}(?! \w))/g, ")");
                    var thisStaticStringEmpty = thisStaticString.replace(/-?\d+(?:\.\d+)?/g, "");
                    var wasStaticStringNULL = staticString == null;
                    if (wasStaticStringNULL) {
                        staticString = thisStaticStringEmpty;
                    }
                    if (thisStaticStringEmpty !== staticString) {
                        constants_1 = true;
                    }
                    if (!constants_1) {
                        var match = void 0;
                        var thisValues = [];
                        while (match = (/(?:-?\d+(?:\.\d+)?)/).exec(thisStaticString)) {
                            var thisStaticStringArray = thisStaticString.split("");
                            thisStaticStringArray.splice(match.index, match[0].length);
                            thisStaticString = thisStaticStringArray.join("");
                            thisValues.push(parseFloat(match[0]));
                            if (wasStaticStringNULL) {
                                indexes.push(match.index);
                            }
                        }
                        frameValues.push(thisValues);
                    }
                }
            });
            if (constants_1) {
                return {
                    compute: function (frameNumber) {
                        if (frameNumber === "before") {
                            if (beforeValue != null) {
                                return beforeValue;
                            }
                            return frames[0][1];
                        }
                        else if (frameNumber === "after") {
                            if (afterValue != null) {
                                return afterValue;
                            }
                            return frames[frames.length - 1][1];
                        }
                        var index = getNearestLeftIndexOf(frameNumber);
                        if (index === -1) {
                            return "";
                        }
                        return frames[index][1];
                    },
                    needUpdateAt: needUpdateAt
                };
            }
        }
        if (frameValues.length === 0) {
            return {
                compute: function (frameNumber) {
                    if (frameNumber === "before" && beforeValue != null) {
                        return beforeValue;
                    }
                    else if (frameNumber === "after" && afterValue != null) {
                        return afterValue;
                    }
                    return "";
                },
                needUpdateAt: [needUpdateAt[0], null, null, needUpdateAt[3]]
            };
        }
        var staticStringArray = staticString.split("").reduce(function (prev, current, index) {
            if (indexes.some(function (i) { return i === index; })) {
                prev.push("");
            }
            prev[prev.length - 1] += current;
            return prev;
        }, [""]);
        function constructString(values) {
            var constructedString = "";
            var index = 0;
            var indexesLength = indexes.length;
            for (var i = 0; i < indexesLength; i++) {
                constructedString += staticStringArray[index] + values[i].toString();
                index++;
            }
            if (index < staticStringArray.length) {
                constructedString += staticStringArray[index];
            }
            return constructedString;
        }
        return {
            compute: function (frameNumber) {
                if (frameNumber === "before") {
                    if (beforeValue != null) {
                        return beforeValue;
                    }
                    return constructString(frameValues[0]);
                }
                else if (frameNumber === "after") {
                    if (afterValue != null) {
                        return afterValue;
                    }
                    return constructString(frameValues[frameValues.length - 1]);
                }
                frameNumber = Math.min(Math.max(0, frameNumber), 1);
                var index = getNearestLeftIndexOf(frameNumber);
                if (index === -1) {
                    return "";
                }
                if (index === frameNumbers.length - 1) {
                    return constructString(frameValues[index]);
                }
                var left = frameNumbers[index];
                var right = frameNumbers[index + 1];
                var perc = (frameNumber - left) / (right - left);
                var computedValues = [];
                var frameValue = frameValues[index];
                var nextFrameValue = frameValues[index + 1];
                var frameValueLength = frameValue.length;
                for (var v_index = 0; v_index < frameValueLength; v_index++) {
                    var value = frameValue[v_index];
                    var nextValue = nextFrameValue[v_index];
                    computedValues.push(value + ((nextValue - value) * perc));
                }
                return constructString(computedValues);
            },
            needUpdateAt: needUpdateAt
        };
    }
    var SCROLL_OBJECT = Symbol("scroll-object");
    var SCROLL_PARENT = Symbol("scroll-parent");
    var ScrollObject = (function () {
        function ScrollObject(el, frames) {
            this.el = el;
            this._needUpdateAt = [false, null, null, false];
            this._frames = [];
            this._lastRenderFrame = null;
            this.refresh(frames);
        }
        ScrollObject.prototype.refresh = function (frames) {
            var _this = this;
            this.el[SCROLL_OBJECT] = this;
            this._frames = [];
            var _loop_1 = function (key) {
                if (!Object.prototype.hasOwnProperty.call(frames, key)) {
                    return "continue";
                }
                var splitKey = key.split(".");
                var _a = __read(splitKey.pop().match(/^([^\(\)]*)(\(\))?$/) || [], 3), isValid = _a[0], lastKey = _a[1], isFunction = _a[2];
                if (!isValid) {
                    return "continue";
                }
                var _b = computeFrames(frames[key]), compute = _b.compute, needUpdateAt = _b.needUpdateAt;
                if (isFunction && needUpdateAt.every(function (value, index) {
                    if (index === 0 || index === 3) {
                        return value === false;
                    }
                    return value === null;
                })) {
                    needUpdateAt[0] = true;
                    needUpdateAt[1] = 0;
                    needUpdateAt[2] = 1;
                    needUpdateAt[3] = true;
                }
                var keyLength = splitKey.length;
                var accessor = function () {
                    var lastObject = _this.el;
                    for (var i = 0; i < keyLength; i++) {
                        if (lastObject == null) {
                            return [null, ""];
                        }
                        lastObject = lastObject[splitKey[i]];
                    }
                    return [lastObject, lastKey];
                };
                this_1._frames.push([accessor, isFunction != null, compute]);
                this_1._needUpdateAt[0] = this_1._needUpdateAt[0] || needUpdateAt[0];
                if (this_1._needUpdateAt[1] !== needUpdateAt[1] &&
                    needUpdateAt[1] != null && (this_1._needUpdateAt[1] == null ||
                    needUpdateAt[1] < this_1._needUpdateAt[1])) {
                    this_1._needUpdateAt[1] = needUpdateAt[1];
                }
                if (this_1._needUpdateAt[2] !== needUpdateAt[2] &&
                    needUpdateAt[2] != null && (this_1._needUpdateAt[2] == null ||
                    needUpdateAt[2] > this_1._needUpdateAt[2])) {
                    this_1._needUpdateAt[2] = needUpdateAt[2];
                }
                this_1._needUpdateAt[3] = this_1._needUpdateAt[3] || needUpdateAt[3];
            };
            var this_1 = this;
            for (var key in frames) {
                _loop_1(key);
            }
            this._lastRenderFrame = null;
            this.el[SCROLL_PARENT].refresh();
            return this;
        };
        ScrollObject.prototype.render = function (frame, renders, force) {
            if (force === void 0) { force = false; }
            if (!force &&
                this._lastRenderFrame === frame) {
                return renders;
            }
            if (this._lastRenderFrame != null &&
                frame !== "before" && frame !== "after" &&
                this._lastRenderFrame !== "before" &&
                this._lastRenderFrame !== "after" &&
                ((this._needUpdateAt[1] == null || frame < this._needUpdateAt[1]) ||
                    (this._needUpdateAt[2] == null || frame > this._needUpdateAt[2])) &&
                ((this._needUpdateAt[1] == null || this._lastRenderFrame < this._needUpdateAt[1]) ||
                    (this._needUpdateAt[2] == null || this._lastRenderFrame > this._needUpdateAt[2]))) {
                return renders;
            }
            this._lastRenderFrame = frame;
            for (var i = this._frames.length - 1; i >= 0; i--) {
                var currentFrame = this._frames[i];
                var accessor = currentFrame[0], isFunction = currentFrame[1], compute = currentFrame[2];
                var accessorResult = accessor();
                var object = accessorResult[0];
                if (object == null) {
                    continue;
                }
                var key = accessorResult[1];
                if (isFunction) {
                    renders.push([object, key, __spreadArray([
                            frame
                        ], __read(compute(frame).split(",").map(function (t) { return t.trim(); }).filter(function (t) { return t !== ""; })))]);
                }
                else {
                    renders.push([object, key, compute(frame)]);
                }
            }
            return renders;
        };
        return ScrollObject;
    }());
    function getFirstScrollParent(element) {
        if (element == null) {
            return null;
        }
        if (element.scrollHeight !== element.clientHeight ||
            element.scrollWidth !== element.scrollWidth) {
            return element;
        }
        return getFirstScrollParent(element.parentElement);
    }
    var ScrollParent = (function () {
        function ScrollParent(el) {
            this.el = el;
            this.children = [];
            this.trigger = 0;
            this.topOffset = 0;
            this.bottomOffset = 0;
            this._lastPosition = null;
            this._parents = [];
            el[SCROLL_PARENT] = this;
            this._computedStyle = window.getComputedStyle(this.el);
        }
        ScrollParent.prototype.refresh = function () {
            this._lastPosition = null;
            this._parents = [];
            var el = this.el;
            while (true) {
                el = getFirstScrollParent(el);
                if (el == null) {
                    break;
                }
                if (el !== this.el) {
                    this._parents.push(el);
                }
                el = el.parentElement;
            }
            return this;
        };
        ScrollParent.prototype._getRectTop = function () {
            var top = this.el.offsetTop;
            var lastParentScrollTop = null;
            for (var i = this._parents.length - 1; i >= 0; i--) {
                var parent_1 = this._parents[i];
                top += parent_1.offsetTop - parent_1.scrollTop;
                if (parent_1.parentElement == null) {
                    lastParentScrollTop = parent_1.scrollTop;
                }
            }
            return top - (lastParentScrollTop == window.pageYOffset ? 0 : window.pageYOffset);
        };
        ScrollParent.prototype.render = function (renders, force) {
            if (force === void 0) { force = false; }
            if (this.children.length === 0 || (this.el.clientHeight === 0 && this.el.clientWidth === 0)) {
                return renders;
            }
            var rectTop = this._getRectTop();
            var rectBottom = rectTop + this.el.offsetHeight;
            var trigger = document.documentElement.clientHeight * this.trigger;
            var top = rectTop - this.topOffset;
            var bottom = rectBottom + this.bottomOffset;
            var position = (trigger - top) / (bottom - top);
            var actualPosition = position > 1 ? "after" : position < 0 ? "before" : position;
            if (actualPosition === this._lastPosition && !force) {
                return renders;
            }
            this._lastPosition = actualPosition;
            for (var i = this.children.length - 1; i >= 0; i--) {
                this.children[i].render(this._lastPosition, renders, force);
            }
            return renders;
        };
        ScrollParent.prototype.remove = function (obj) {
            var index = -1;
            if (this.children.some(function (child, i) { index = i; return child === obj || child.el === obj.el; })) {
                this.children.splice(index, 1);
                this._lastPosition = null;
            }
        };
        ScrollParent.prototype.add = function (obj) {
            this.remove(obj);
            this.children.push(obj);
            this._lastPosition = null;
        };
        return ScrollParent;
    }());
    var baseScrollParent = new ScrollParent(document.documentElement);
    document.body[SCROLL_PARENT] = baseScrollParent;
    var scrollParents = [
        baseScrollParent
    ];
    function render() {
        var renders = [];
        for (var i = scrollParents.length - 1; i >= 0; i--) {
            scrollParents[i].render(renders);
        }
        for (var i = renders.length - 1; i >= 0; i--) {
            var render_1 = renders[i];
            var result = render_1[2];
            var object = render_1[0];
            if (Array.isArray(result)) {
                object[render_1[1]].apply(object, result);
            }
            else {
                object[render_1[1]] = result;
            }
        }
    }
    var stop = false;
    var started = false;
    function startLoop() {
        stop = false;
        if (started) {
            return;
        }
        started = true;
        requestAnimationFrame(function fn() {
            if (!stop) {
                render();
                requestAnimationFrame(fn);
            }
        });
    }
    function endLoop() {
        stop = true;
        started = false;
    }
    function getRefreshedParent(element) {
        if (element[SCROLL_PARENT]) {
            return element[SCROLL_PARENT].refresh();
        }
        var parent = new ScrollParent(element);
        scrollParents.push(parent);
        return parent;
    }
    function parse(element, parent, subtree) {
        if (subtree === void 0) { subtree = true; }
        var scrollOptions = null;
        Array.prototype.forEach.call(element.attributes, function (attr) {
            if (!attr.name.match(/^data-scroll[\-\.]/)) {
                return;
            }
            var data = attr.name.substr(11);
            if (data === "-parent") {
                parent = getRefreshedParent(element);
            }
            else if (data === "-trigger") {
                var trigger = parseFloat(attr.value);
                if (!isNaN(trigger)) {
                    parent = getRefreshedParent(element);
                    parent.trigger = trigger;
                }
            }
            else if (data === "-bottom") {
                var bottom = parseFloat(attr.value);
                if (!isNaN(bottom)) {
                    parent = getRefreshedParent(element);
                    parent.bottomOffset = bottom;
                }
            }
            else if (data === "-top") {
                var top_1 = parseFloat(attr.value);
                if (!isNaN(top_1)) {
                    parent = getRefreshedParent(element);
                    parent.topOffset = top_1;
                }
            }
            else {
                var dataSplit = data.split("-");
                dataSplit.shift();
                if (dataSplit.length > 2 || dataSplit.length === 0) {
                    return;
                }
                if (scrollOptions == null) {
                    scrollOptions = {};
                }
                var propertyName = dataSplit[0].replace(/(?:^|[\Wa-zA-Z])(_[a-zA-Z])/, function (_, g) {
                    return _.replace(g, g[1].toUpperCase());
                }).replace("__", "_");
                if (dataSplit.length === 1 && dataSplit[0].match(/(.*)\(\)$/)) {
                    scrollOptions[propertyName] = [];
                }
                else {
                    var frame = parseFloat(dataSplit[1]);
                    if (!isNaN(frame)) {
                        scrollOptions[propertyName] = (scrollOptions[propertyName] || []).concat([[frame, attr.value]]);
                    }
                    else if (dataSplit[1] === "before") {
                        scrollOptions[propertyName] = (scrollOptions[propertyName] || []).concat([["before", attr.value]]);
                    }
                    else if (dataSplit[1] === "after") {
                        scrollOptions[propertyName] = (scrollOptions[propertyName] || []).concat([["after", attr.value]]);
                    }
                    else if (dataSplit[1] === "extrapolate") {
                        scrollOptions[propertyName] = (scrollOptions[propertyName] || []).concat([
                            [0, EXTRAPOLATE], [1, EXTRAPOLATE]
                        ]);
                    }
                }
            }
        });
        if (scrollOptions != null) {
            element[SCROLL_PARENT] = parent;
            if (element[SCROLL_OBJECT]) {
                element[SCROLL_OBJECT].refresh(scrollOptions);
            }
            else {
                parent.children.push(new ScrollObject(element, scrollOptions));
            }
        }
        if (subtree) {
            Array.prototype.forEach.call(element.children, function (child) { parse(child, parent); });
        }
    }
    function add(element, subtree) {
        if (subtree === void 0) { subtree = true; }
        var parent = element;
        var firstScrollParent = element[SCROLL_PARENT];
        while (parent !== document.body && parent != null) {
            parent = parent.parentElement;
            if (parent == null) {
                return;
            }
            firstScrollParent = firstScrollParent || parent[SCROLL_PARENT];
        }
        if (firstScrollParent == null) {
            firstScrollParent = baseScrollParent;
            if (baseScrollParent.children.length === 0) {
                scrollParents.push(baseScrollParent);
            }
        }
        parse(element, firstScrollParent, subtree);
        if (scrollParents.length > 0) {
            startLoop();
        }
    }
    function remove(element, renderFrame) {
        if (renderFrame === void 0) { renderFrame = null; }
        var scrollParent = element[SCROLL_PARENT];
        var scrollObject = element[SCROLL_OBJECT];
        if (scrollParent != null) {
            if (scrollParent.el === element) {
                var index_1 = -1;
                if (scrollParents.some(function (p, i) {
                    index_1 = i;
                    return p === scrollParent;
                })) {
                    scrollParents.splice(index_1, 1);
                }
            }
            if (scrollObject != null) {
                scrollParent.remove(scrollObject);
                if (renderFrame != null) {
                    var renders = [];
                    scrollObject.render(renderFrame, renders, true);
                    for (var i = renders.length - 1; i >= 0; i--) {
                        var render_2 = renders[i];
                        render_2[0][render_2[1]] = render_2[2];
                    }
                }
            }
            delete element[SCROLL_PARENT];
            delete element[SCROLL_OBJECT];
        }
        Array.prototype.forEach.call(element.children, function (child) {
            remove(child, renderFrame);
        });
        if (scrollParent === baseScrollParent && baseScrollParent.children.length === 0) {
            var index_2 = -1;
            if (scrollParents.some(function (p, i) {
                if (p === baseScrollParent) {
                    index_2 = i;
                    return true;
                }
                return false;
            })) {
                scrollParents.splice(index_2, 1);
            }
        }
        if (scrollParents.length === 0) {
            endLoop();
        }
    }

    exports.add = add;
    exports.remove = remove;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
