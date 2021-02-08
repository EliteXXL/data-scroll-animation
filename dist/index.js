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

    /** @deprecated */
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    function computeFrames(frames) {
        var staticString = null;
        var indexes = [];
        var frameNumbers = [];
        var frameValues = [];
        var beforeValue = null;
        var afterValue = null;
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
                if (frame[0] === "after") {
                    afterValue = frame[1];
                    return;
                }
                else if (frame[0] === "before") {
                    beforeValue = frame[1];
                    return;
                }
                var thisStaticString;
                frameNumbers.push(frame[0]);
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
                return function (frameNumber) {
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
                };
            }
        }
        if (frameValues.length === 0) {
            return function (frameNumber) {
                if (frameNumber === "before" && beforeValue != null) {
                    return beforeValue;
                }
                else if (frameNumber === "after" && afterValue != null) {
                    return afterValue;
                }
                return "";
            };
        }
        function constructString(values) {
            var staticStringArray = staticString.split("");
            for (var i = indexes.length - 1; i >= 0; i--) {
                staticStringArray.splice(indexes[i], 0, values[i].toString());
            }
            return staticStringArray.join("");
        }
        return function (frameNumber) {
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
            frameValues[index].forEach(function (value, v_index) {
                var nextValue = frameValues[index + 1][v_index];
                computedValues.push(value + ((nextValue - value) * perc));
            });
            return constructString(computedValues);
        };
    }
    var SCROLL_OBJECT = Symbol("scroll-object");
    var SCROLL_PARENT = Symbol("scroll-parent");
    var ScrollObject = (function () {
        function ScrollObject(el, frames) {
            this.el = el;
            this._frames = {};
            this.refresh(frames);
        }
        ScrollObject.prototype.refresh = function (frames) {
            this.el[SCROLL_OBJECT] = this;
            for (var key in frames) {
                if (!Object.prototype.hasOwnProperty.call(frames, key)) {
                    continue;
                }
                this._frames[key] = computeFrames(frames[key]);
            }
            return this;
        };
        ScrollObject.prototype.render = function (frame) {
            var _loop_1 = function (key) {
                if (!Object.prototype.hasOwnProperty.call(this_1._frames, key)) {
                    return "continue";
                }
                var lastObject = this_1.el;
                var splitKey = key.split(".");
                var lastKey = splitKey.pop();
                splitKey.forEach(function (key) {
                    if (lastObject == null) {
                        return;
                    }
                    lastObject = lastObject[key];
                });
                if (lastObject == null) {
                    return "continue";
                }
                var match = lastKey.match(/(.*)\(\)$/);
                if (match) {
                    lastObject[match[1]].apply(lastObject, __spread([
                        frame
                    ], this_1._frames[key](frame).split(",").map(function (t) { return t.trim(); }).filter(function (t) { return t !== ""; })));
                }
                else {
                    lastObject[lastKey] = this_1._frames[key](frame);
                }
            };
            var this_1 = this;
            for (var key in this._frames) {
                _loop_1(key);
            }
        };
        return ScrollObject;
    }());
    var ScrollParent = (function () {
        function ScrollParent(el) {
            this.el = el;
            this.children = [];
            this.trigger = 0;
            this.topOffset = 0;
            this.bottomOffset = 0;
            this._lastPosition = null;
            el[SCROLL_PARENT] = this;
        }
        ScrollParent.prototype.refresh = function () {
            this._lastPosition = null;
            return this;
        };
        ScrollParent.prototype.render = function (force) {
            var _this = this;
            if (force === void 0) { force = false; }
            if (this.children.length === 0) {
                return;
            }
            var rect = this.el.getBoundingClientRect();
            var trigger = document.documentElement.clientHeight * this.trigger;
            var top = rect.top - this.topOffset;
            var bottom = rect.bottom + this.bottomOffset;
            var position = (trigger - top) / (bottom - top);
            var actualPosition = position > 1 ? "after" : position < 0 ? "before" : position;
            if (actualPosition !== this._lastPosition || force) {
                this._lastPosition = actualPosition;
                this.children.forEach(function (child) {
                    child.render(_this._lastPosition);
                });
                this.el.dispatchEvent(new CustomEvent("render", { detail: { position: this._lastPosition }, bubbles: false }));
            }
        };
        ScrollParent.prototype.remove = function (obj) {
            var index = -1;
            if (this.children.some(function (child, i) { index = i; return child === obj || child.el === obj.el; })) {
                this.children.splice(index, 1);
            }
        };
        ScrollParent.prototype.add = function (obj) {
            this.remove(obj);
            this.children.push(obj);
        };
        return ScrollParent;
    }());
    var baseScrollParent = new ScrollParent(document.documentElement);
    document.body[SCROLL_PARENT] = baseScrollParent;
    var scrollParents = [
        baseScrollParent
    ];
    function render() {
        scrollParents.forEach(function (parent) {
            parent.render();
        });
    }
    var stop = false;
    function startLoop() {
        stop = false;
        requestAnimationFrame(function fn() {
            render();
            if (!stop) {
                requestAnimationFrame(fn);
            }
        });
    }
    function endLoop() {
        stop = true;
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
                if (element[SCROLL_PARENT]) {
                    parent = element[SCROLL_PARENT].refresh();
                }
                else {
                    scrollParents.push(parent = new ScrollParent(element));
                }
            }
            else if (data === "-trigger") {
                var trigger = parseFloat(attr.value);
                if (!isNaN(trigger)) {
                    if (element[SCROLL_PARENT]) {
                        parent = element[SCROLL_PARENT].refresh();
                    }
                    else {
                        scrollParents.push(parent = new ScrollParent(element));
                    }
                    parent.trigger = trigger;
                }
            }
            else if (data === "-bottom") {
                var bottom = parseFloat(attr.value);
                if (!isNaN(bottom)) {
                    if (element[SCROLL_PARENT]) {
                        parent = element[SCROLL_PARENT].refresh();
                    }
                    else {
                        scrollParents.push(parent = new ScrollParent(element));
                    }
                    parent.bottomOffset = bottom;
                }
            }
            else if (data === "-top") {
                var top_1 = parseFloat(attr.value);
                if (!isNaN(top_1)) {
                    if (element[SCROLL_PARENT]) {
                        parent = element[SCROLL_PARENT].refresh();
                    }
                    else {
                        scrollParents.push(parent = new ScrollParent(element));
                    }
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
        parse(element, firstScrollParent || baseScrollParent, subtree);
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
                    scrollObject.render(renderFrame);
                }
            }
            delete element[SCROLL_PARENT];
            delete element[SCROLL_OBJECT];
        }
        Array.prototype.forEach.call(element.children, function (child) {
            remove(child);
        });
        if (scrollParents.length === 0) {
            endLoop();
        }
    }

    exports.add = add;
    exports.remove = remove;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
