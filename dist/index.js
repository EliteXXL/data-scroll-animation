(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.dataScrollAnimation = {}));
})(this, (function (exports) { 'use strict';

    const EXTRAPOLATE = Symbol("extrapolate");
    function computeFrames(frames) {
        let staticString = null;
        let indexes = [];
        let frameNumbers = [];
        let frameValues = [];
        let beforeValue = null;
        let afterValue = null;
        const needUpdateAt = [false, null, null, false];
        function getNearestLeftIndexOf(frameNumber) {
            if (frameNumbers.length === 0) {
                return -1;
            }
            let leftIndex = 0;
            for (let i = 1; i < frameNumbers.length; i++) {
                if (frameNumbers[i] > frameNumber) {
                    break;
                }
                leftIndex = i;
            }
            return leftIndex;
        }
        {
            let constants = false;
            frames.sort((a, b) => {
                let result;
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
            frames.forEach(frame => {
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
                let thisStaticString;
                frameNumbers.push(frame[0]);
                if (needUpdateAt[1] == null || needUpdateAt[1] > frame[0]) {
                    needUpdateAt[1] = frame[0];
                }
                if (needUpdateAt[2] == null || needUpdateAt[2] < frame[0]) {
                    needUpdateAt[2] = frame[0];
                }
                if (!constants) {
                    thisStaticString = frame[1].trim()
                        .replace(/[ ]*,[ ]*/g, ",")
                        .replace(/(?:\([ ]+)/g, "(")
                        .replace(/(?:\)[ ]+(?= \w))/g, ") ")
                        .replace(/(?:\)[ ]{2,}(?! \w))/g, ")");
                    const thisStaticStringEmpty = thisStaticString.replace(/-?\d+(?:\.\d+)?/g, "");
                    const wasStaticStringNULL = staticString == null;
                    if (wasStaticStringNULL) {
                        staticString = thisStaticStringEmpty;
                    }
                    if (thisStaticStringEmpty !== staticString) {
                        constants = true;
                    }
                    if (!constants) {
                        let match;
                        const thisValues = [];
                        while (match = (/(?:-?\d+(?:\.\d+)?)/).exec(thisStaticString)) {
                            let thisStaticStringArray = thisStaticString.split("");
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
            if (constants) {
                return {
                    compute: (frameNumber) => {
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
                        const index = getNearestLeftIndexOf(frameNumber);
                        if (index === -1) {
                            return "";
                        }
                        return frames[index][1];
                    },
                    needUpdateAt
                };
            }
        }
        if (frameValues.length === 0) {
            return {
                compute: (frameNumber) => {
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
        const staticStringArray = staticString.split("").reduce((prev, current, index) => {
            if (indexes.some(i => i === index)) {
                prev.push("");
            }
            prev[prev.length - 1] += current;
            return prev;
        }, [""]);
        function constructString(values) {
            let constructedString = "";
            let index = 0;
            const indexesLength = indexes.length;
            for (let i = 0; i < indexesLength; i++) {
                constructedString += staticStringArray[index] + values[i].toString();
                index++;
            }
            if (index < staticStringArray.length) {
                constructedString += staticStringArray[index];
            }
            return constructedString;
        }
        return {
            compute: (frameNumber) => {
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
                const index = getNearestLeftIndexOf(frameNumber);
                if (index === -1) {
                    return "";
                }
                if (index === frameNumbers.length - 1) {
                    return constructString(frameValues[index]);
                }
                const left = frameNumbers[index];
                const right = frameNumbers[index + 1];
                const perc = (frameNumber - left) / (right - left);
                const computedValues = [];
                const frameValue = frameValues[index];
                const nextFrameValue = frameValues[index + 1];
                const frameValueLength = frameValue.length;
                for (let v_index = 0; v_index < frameValueLength; v_index++) {
                    const value = frameValue[v_index];
                    const nextValue = nextFrameValue[v_index];
                    computedValues.push(value + ((nextValue - value) * perc));
                }
                return constructString(computedValues);
            },
            needUpdateAt
        };
    }
    const SCROLL_OBJECT = Symbol("scroll-object");
    const SCROLL_PARENT = Symbol("scroll-parent");
    class ScrollObject {
        el;
        constructor(el, frames) {
            this.el = el;
            this.refresh(frames);
        }
        refresh(frames) {
            this.el[SCROLL_OBJECT] = this;
            this._frames = [];
            for (let key in frames) {
                if (!Object.prototype.hasOwnProperty.call(frames, key)) {
                    continue;
                }
                const splitKey = key.split(".");
                const [isValid, lastKey, isFunction] = splitKey.pop().match(/^([^\(\)]*)(\(\))?$/) || [];
                if (!isValid) {
                    continue;
                }
                const { compute, needUpdateAt } = computeFrames(frames[key]);
                if (isFunction && needUpdateAt.every((value, index) => {
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
                const keyLength = splitKey.length;
                const accessor = () => {
                    let lastObject = this.el;
                    for (let i = 0; i < keyLength; i++) {
                        if (lastObject == null) {
                            return [null, ""];
                        }
                        lastObject = lastObject[splitKey[i]];
                    }
                    return [lastObject, lastKey];
                };
                this._frames.push([accessor, isFunction != null, compute]);
                this._needUpdateAt[0] = this._needUpdateAt[0] || needUpdateAt[0];
                if (this._needUpdateAt[1] !== needUpdateAt[1] &&
                    needUpdateAt[1] != null && (this._needUpdateAt[1] == null ||
                    needUpdateAt[1] < this._needUpdateAt[1])) {
                    this._needUpdateAt[1] = needUpdateAt[1];
                }
                if (this._needUpdateAt[2] !== needUpdateAt[2] &&
                    needUpdateAt[2] != null && (this._needUpdateAt[2] == null ||
                    needUpdateAt[2] > this._needUpdateAt[2])) {
                    this._needUpdateAt[2] = needUpdateAt[2];
                }
                this._needUpdateAt[3] = this._needUpdateAt[3] || needUpdateAt[3];
            }
            this._lastRenderFrame = null;
            this.el[SCROLL_PARENT].refresh();
            return this;
        }
        _needUpdateAt = [false, null, null, false];
        // _frames: { [key: string]: (frame: FramePosition) => string } = {};
        // [ accessor => [object, key], isFunction, computer ]
        _frames = [];
        _lastRenderFrame = null;
        render(frame, renders, force = false) {
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
            for (let i = this._frames.length - 1; i >= 0; i--) {
                const currentFrame = this._frames[i];
                const accessor = currentFrame[0], isFunction = currentFrame[1], compute = currentFrame[2];
                const accessorResult = accessor();
                const object = accessorResult[0];
                if (object == null) {
                    continue;
                }
                const key = accessorResult[1];
                if (isFunction) {
                    renders.push([object, key, [
                            frame,
                            ...compute(frame).split(",").map(t => t.trim()).filter(t => t !== "")
                        ]]);
                }
                else {
                    renders.push([object, key, compute(frame)]);
                }
            }
            return renders;
        }
    }
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
    class ScrollParent {
        el;
        constructor(el) {
            this.el = el;
            el[SCROLL_PARENT] = this;
            this._computedStyle = window.getComputedStyle(this.el);
        }
        refresh() {
            this._lastPosition = null;
            this._parents = [];
            let el = this.el;
            while (true) {
                el = getFirstScrollParent(el);
                if (el == null) {
                    break;
                }
                if (el !== this.el && el !== document.documentElement) {
                    this._parents.push(el);
                }
                el = el.parentElement;
            }
            return this;
        }
        children = [];
        trigger = 0;
        topOffset = 0;
        bottomOffset = 0;
        _lastPosition = null;
        _computedStyle;
        _parents = [];
        _getRectTop() {
            let top = this.el.offsetTop;
            let lastParentScrollTop = null;
            for (let i = this._parents.length - 1; i >= 0; i--) {
                const parent = this._parents[i];
                top += parent.offsetTop - parent.scrollTop;
                if (parent.parentElement == null) {
                    lastParentScrollTop = parent.scrollTop;
                }
            }
            return top - (lastParentScrollTop == window.pageYOffset ? 0 : window.pageYOffset);
        }
        ;
        render(renders, force = false) {
            if (this.children.length === 0 || (this.el.clientHeight === 0 && this.el.clientWidth === 0)) {
                return renders;
            }
            // const rect: DOMRect = this.el.getBoundingClientRect();
            // const rectTop: number = rect.top;
            // const rectBottom: number = rect.bottom;
            const rectTop = this._getRectTop();
            const rectBottom = rectTop + this.el.offsetHeight;
            const trigger = document.documentElement.clientHeight * this.trigger;
            const top = rectTop - this.topOffset;
            const bottom = rectBottom + this.bottomOffset;
            const position = (trigger - top) / (bottom - top);
            const actualPosition = position > 1 ? "after" : position < 0 ? "before" : position;
            if (actualPosition === this._lastPosition && !force) {
                return renders;
            }
            this._lastPosition = actualPosition;
            for (let i = this.children.length - 1; i >= 0; i--) {
                this.children[i].render(this._lastPosition, renders, force);
            }
            // this.el.dispatchEvent(new CustomEvent("render", { detail: { position: this._lastPosition }, bubbles: false }));
            return renders;
        }
        remove(obj) {
            let index = -1;
            if (this.children.some((child, i) => { index = i; return child === obj || child.el === obj.el; })) {
                this.children.splice(index, 1);
                this._lastPosition = null;
            }
        }
        add(obj) {
            this.remove(obj);
            this.children.push(obj);
            this._lastPosition = null;
        }
    }
    const baseScrollParent = new ScrollParent(document.documentElement);
    document.body[SCROLL_PARENT] = baseScrollParent;
    const scrollParents = [
        baseScrollParent
    ];
    function render() {
        const renders = [];
        for (let i = scrollParents.length - 1; i >= 0; i--) {
            scrollParents[i].render(renders);
        }
        for (let i = renders.length - 1; i >= 0; i--) {
            const render = renders[i];
            const result = render[2];
            const object = render[0];
            if (Array.isArray(result)) {
                object[render[1]].apply(object, result);
            }
            else {
                object[render[1]] = result;
            }
        }
    }
    let stop = false;
    let started = false;
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
        const parent = new ScrollParent(element);
        scrollParents.push(parent);
        return parent;
    }
    function parse(element, parent, subtree = true) {
        let scrollOptions = null;
        Array.prototype.forEach.call(element.attributes, (attr) => {
            if (!attr.name.match(/^data-scroll[\-\.]/)) {
                return;
            }
            const data = attr.name.substr(11);
            if (data === "-parent") {
                parent = getRefreshedParent(element);
            }
            else if (data === "-trigger") {
                let trigger = parseFloat(attr.value);
                if (!isNaN(trigger)) {
                    parent = getRefreshedParent(element);
                    parent.trigger = trigger;
                }
            }
            else if (data === "-bottom") {
                let bottom = parseFloat(attr.value);
                if (!isNaN(bottom)) {
                    parent = getRefreshedParent(element);
                    parent.bottomOffset = bottom;
                }
            }
            else if (data === "-top") {
                let top = parseFloat(attr.value);
                if (!isNaN(top)) {
                    parent = getRefreshedParent(element);
                    parent.topOffset = top;
                }
            }
            else {
                const dataSplit = data.split("-");
                dataSplit.shift();
                if (dataSplit.length > 2 || dataSplit.length === 0) {
                    return;
                }
                if (scrollOptions == null) {
                    scrollOptions = {};
                }
                // convert "_[a-z]" to "[A-Z]" and "__" to "_"
                const propertyName = dataSplit[0].replace(/(?:^|[\Wa-zA-Z])(_[a-zA-Z])/, function (_, g) {
                    return _.replace(g, g[1].toUpperCase());
                }).replace("__", "_");
                if (dataSplit.length === 1 && dataSplit[0].match(/(.*)\(\)$/)) {
                    scrollOptions[propertyName] = [];
                }
                else {
                    const frame = parseFloat(dataSplit[1]);
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
            Array.prototype.forEach.call(element.children, child => { parse(child, parent); });
        }
    }
    function add(element, subtree = true) {
        let parent = element;
        let firstScrollParent = element[SCROLL_PARENT];
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
    function remove(element, renderFrame = null) {
        let scrollParent = element[SCROLL_PARENT];
        let scrollObject = element[SCROLL_OBJECT];
        if (scrollParent != null) {
            if (scrollParent.el === element) {
                let index = -1;
                if (scrollParents.some((p, i) => {
                    index = i;
                    return p === scrollParent;
                })) {
                    scrollParents.splice(index, 1);
                }
            }
            if (scrollObject != null) {
                scrollParent.remove(scrollObject);
                if (renderFrame != null) {
                    const renders = [];
                    scrollObject.render(renderFrame, renders, true);
                    for (let i = renders.length - 1; i >= 0; i--) {
                        const render = renders[i];
                        render[0][render[1]] = render[2];
                    }
                }
            }
            delete element[SCROLL_PARENT];
            delete element[SCROLL_OBJECT];
        }
        Array.prototype.forEach.call(element.children, child => {
            remove(child, renderFrame);
        });
        if (scrollParent === baseScrollParent && baseScrollParent.children.length === 0) {
            let index = -1;
            if (scrollParents.some((p, i) => {
                if (p === baseScrollParent) {
                    index = i;
                    return true;
                }
                return false;
            })) {
                scrollParents.splice(index, 1);
            }
        }
        if (scrollParents.length === 0) {
            endLoop();
        }
    }

    exports.add = add;
    exports.remove = remove;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
