const EXTRAPOLATE: unique symbol = Symbol("extrapolate");
type FramePosition = number | "before" | "after";

function computeFrames(frames: [ FramePosition, string | typeof EXTRAPOLATE ][]): {
    compute: (frame: FramePosition) => string,
    needUpdateAt: [ boolean, number | null, number | null, boolean ]
 } {
    let staticString: string | null = null;
    let indexes: number[] = [];
    let frameNumbers: number[] = [];
    let frameValues: number[][] = [];
    let beforeValue: string | null = null;
    let afterValue: string | null = null;
    const needUpdateAt: [boolean, number | null, number | null, boolean] = [false, null, null, false];
    function getNearestLeftIndexOf(frameNumber: number): number {
        if (frameNumbers.length === 0) {
            return -1;
        }
        let leftIndex: number = 0;
        for (let i: number = 1; i < frameNumbers.length; i++) {
            if (frameNumbers[i] > frameNumber) {
                break;
            }
            leftIndex = i;
        }
        return leftIndex;
    }
    {
        let constants: boolean = false;
        frames.sort((a, b) => {
            let result: number;
            if (a[0] === "before") {
                result = b[0] === "after" ? -1 : b[0] === "before" ? 0 : 1;
            } else if (a[0] === "after") {
                result = b[0] === "after" ? 0 : b[0] === "before" ? 1 : -1;
            } else if (b[0] === "before") {
                result = -1;
            } else if (b[0] === "after") {
                result = -1;
            } else {
                result = a[0] - b[0];
            }
            return result;
        });
        frames.forEach(frame => {
            if (frame[1] === EXTRAPOLATE) {
                if (frame[0] !== "after" && frame[0] !== "before") {
                    frameNumbers.push(frame[0])
                }
                return;
            } else if (frame[0] === "after") {
                afterValue = frame[1];
                needUpdateAt[3] = true;
                return;
            } else if (frame[0] === "before") {
                beforeValue = frame[1];
                needUpdateAt[0] = true;
                return;
            }
            let thisStaticString: string;
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
                const thisStaticStringEmpty: string = thisStaticString.replace(/-?\d+(?:\.\d+)?/g, "");
                const wasStaticStringNULL: boolean = staticString == null;
                if (wasStaticStringNULL) {
                    staticString = thisStaticStringEmpty;
                }
                if (thisStaticStringEmpty !== staticString) {
                    constants = true;
                }
                if (!constants) {
                    let match: RegExpExecArray | null;
                    const thisValues: number[] = [];
                    while (match = (/(?:-?\d+(?:\.\d+)?)/).exec(thisStaticString)) {
                        let thisStaticStringArray: string[] = thisStaticString.split("");
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
                compute: (frameNumber: FramePosition) => {
                    if (frameNumber === "before") {
                        if (beforeValue != null) {
                            return beforeValue;
                        }
                        return frames[0][1] as string;
                    } else if (frameNumber === "after") {
                        if (afterValue != null) {
                            return afterValue;
                        }
                        return frames[frames.length - 1][1] as string;
                    }
                    const index: number = getNearestLeftIndexOf(frameNumber);
                    if (index === -1) {
                        return "";
                    }
                    return frames[index][1] as string;
                },
                needUpdateAt
            };
        }
    }
    if (frameValues.length === 0) {
        return {
            compute: (frameNumber: FramePosition) => {
                if (frameNumber === "before" && beforeValue != null) {
                    return beforeValue;
                } else if (frameNumber === "after" && afterValue != null) {
                    return afterValue;
                }
                return "";
            },
            needUpdateAt: [needUpdateAt[0], null, null, needUpdateAt[3]]
        };
    }
    const staticStringArray: string[] = staticString!.split("").reduce((prev, current, index) => {
        if (indexes.some(i => i === index)) {
            prev.push("");
        }
        prev[prev.length - 1]+= current;
        return prev;
    }, [""] as string[]);
    function constructString(values: number[]): string {
        let constructedString: string = "";
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
        compute: (frameNumber: FramePosition) => {
            if (frameNumber === "before") {
                if (beforeValue != null) {
                    return beforeValue;
                }
                return constructString(frameValues[0]);
            } else if (frameNumber === "after") {
                if (afterValue != null) {
                    return afterValue;
                }
                return constructString(frameValues[frameValues.length - 1]);
            }
            frameNumber = Math.min(Math.max(0, frameNumber), 1);
            const index: number = getNearestLeftIndexOf(frameNumber);
            if (index === -1) {
                return "";
            }
            if (index === frameNumbers.length - 1) {
                return constructString(frameValues[index]);
            }
            const left: number = frameNumbers[index];
            const right: number = frameNumbers[index + 1];
            const perc: number = (frameNumber-left)/(right-left);
            const computedValues: number[] = [];
            const frameValue = frameValues[index];
            const nextFrameValue = frameValues[index + 1];
            const frameValueLength = frameValue.length;
            for (let v_index = 0; v_index < frameValueLength; v_index++) {
                const value = frameValue[v_index];
                const nextValue: number = nextFrameValue[v_index];
                computedValues.push(value + ((nextValue - value) * perc));
            }
            return constructString(computedValues);
        },
        needUpdateAt
    };
}

const SCROLL_OBJECT: unique symbol = Symbol("scroll-object");
const SCROLL_PARENT: unique symbol =  Symbol("scroll-parent");

declare global {
    /* tslint:disable-next-line:interface-name */
    interface HTMLElement {
        [SCROLL_OBJECT]: ScrollObject | undefined;
        [SCROLL_PARENT]: ScrollParent | undefined;
    }
}

class ScrollObject {
    constructor(readonly el: HTMLElement, frames: { [key: string]: [FramePosition, string][] }) {
        this.refresh(frames);
    }
    refresh(frames: { [key: string]: [FramePosition, string][] }): ScrollObject {
        this.el[SCROLL_OBJECT] = this;
        this._frames = [];
        for (let key in frames) {
            if (!Object.prototype.hasOwnProperty.call(frames, key)) {
                continue;
            }
            const splitKey: string[] = key.split(".");
            const [isValid, lastKey, isFunction] = splitKey.pop()!.match(/^([^\(\)]*)(\(\))?$/) || [];
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
            const accessor: () => [ any, string ]= () => {
                let lastObject: any = this.el;
                for (let i = 0; i < keyLength; i++) {
                    if (lastObject == null) {
                        return [null, ""];
                    }
                    lastObject = lastObject[splitKey[i]];
                }
                return [lastObject, lastKey];
            }
            this._frames.push([accessor, isFunction != null, compute]);

            this._needUpdateAt[0] = this._needUpdateAt[0] || needUpdateAt[0];
            if (
                this._needUpdateAt[1] !== needUpdateAt[1] &&
                needUpdateAt[1] != null && (
                    this._needUpdateAt[1] == null ||
                    needUpdateAt[1] < this._needUpdateAt[1]
                )
             ) {
                this._needUpdateAt[1] = needUpdateAt[1]
            }
            if (
                this._needUpdateAt[2] !== needUpdateAt[2] &&
                needUpdateAt[2] != null && (
                    this._needUpdateAt[2] == null ||
                    needUpdateAt[2] > this._needUpdateAt[2]
                )
             ) {
                this._needUpdateAt[2] = needUpdateAt[2]
            }
            this._needUpdateAt[3] = this._needUpdateAt[3] || needUpdateAt[3];
        }
        this._lastRenderFrame = null;
        this.el[SCROLL_PARENT]!.refresh();
        return this;
    }
    _needUpdateAt: [boolean, number | null, number | null, boolean] = [false, null, null, false];
    // _frames: { [key: string]: (frame: FramePosition) => string } = {};
    // [ accessor => [object, key], isFunction, computer ]
    _frames: [ () => [any, string], boolean, (frame: FramePosition) => string ][] = [];
    _lastRenderFrame: FramePosition | null = null;
    render(frame: FramePosition, renders: [any, string, string|any[]][], force: boolean = false): [any, string, string|any[]][] {
        if (!force &&
            this._lastRenderFrame === frame
        ) {
            return renders;
        }
        if (
            this._lastRenderFrame != null &&
            frame !== "before" && frame !== "after" &&
            this._lastRenderFrame !== "before" &&
            this._lastRenderFrame !== "after" &&
            (
                (this._needUpdateAt[1] == null || frame < this._needUpdateAt[1]) ||
                (this._needUpdateAt[2] == null || frame > this._needUpdateAt[2])
            ) &&
            (
                (this._needUpdateAt[1] == null || this._lastRenderFrame < this._needUpdateAt[1]) ||
                (this._needUpdateAt[2] == null || this._lastRenderFrame > this._needUpdateAt[2])
            )
        ) {
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
            } else {
                renders.push([object, key, compute(frame)]);
            }
        }
        return renders;
    }
}

function getFirstScrollParent(element: Element | null): Element | null {
    if (element == null) {
        return null;
    }

    if (
        element.scrollHeight !== element.clientHeight ||
        element.scrollWidth !== element.scrollWidth
    ) {
        return element;
    }
    return getFirstScrollParent(element.parentElement);
}

class ScrollParent {
    constructor(readonly el: HTMLElement) {
        el[SCROLL_PARENT] = this;
        this._computedStyle = window.getComputedStyle(this.el);
    }
    refresh(): ScrollParent {
        this._lastPosition = null;
        this._parents = [];
        let el: Element | null = this.el;
        while (true) {
            el = getFirstScrollParent(el);
            if (el == null) {
                break;
            }
            if (el !== this.el) {
                this._parents.push(el as HTMLElement);
            }
            el = el.parentElement;
        }
        return this;
    }
    children: ScrollObject[] = [];
    trigger: number = 0;
    topOffset: number = 0;
    bottomOffset: number = 0;
    _lastPosition: FramePosition | null = null;
    _computedStyle: CSSStyleDeclaration;
    _parents: HTMLElement[] = [];
    _getRectTop(): number {
        let top: number = this.el.offsetTop;
        for (let i = this._parents.length - 1; i >= 0; i --) {
            const parent = this._parents[i];
            top += parent.offsetTop - parent.scrollTop;
        }
        return top - window.pageYOffset;
    };
    render(renders: [any, string, string|any[]][], force: boolean = false): [any, string, string|any[]][] {
        if (this.children.length === 0 || (this.el.clientHeight === 0 && this.el.clientWidth === 0)) {
            return renders;
        }
        // const rect: DOMRect = this.el.getBoundingClientRect();
        // const rectTop: number = rect.top;
        // const rectBottom: number = rect.bottom;
        const rectTop: number = this._getRectTop();
        const rectBottom: number = rectTop + this.el.offsetHeight;
        const trigger: number = document.documentElement.clientHeight * this.trigger;
        const top: number = rectTop - this.topOffset;
        const bottom: number = rectBottom + this.bottomOffset;
        const position: number = (trigger - top) / (bottom - top);
        const actualPosition: FramePosition = position > 1 ? "after" : position < 0 ? "before" : position;
        if (actualPosition === this._lastPosition && !force) {
            return renders;
        }
        this._lastPosition = actualPosition;
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.children[i].render(this._lastPosition!, renders, force);
        }
        // this.el.dispatchEvent(new CustomEvent("render", { detail: { position: this._lastPosition }, bubbles: false }));
        return renders;
    }
    remove(obj: ScrollObject): void {
        let index: number = -1;
        if (this.children.some((child, i) => { index = i; return child === obj || child.el === obj.el; } )) {
            this.children.splice(index, 1);
            this._lastPosition = null;
        }
    }
    add(obj: ScrollObject): void {
        this.remove(obj);
        this.children.push(obj);
        this._lastPosition = null;
    }
}

const baseScrollParent: ScrollParent = new ScrollParent(document.documentElement);
document.body[SCROLL_PARENT] = baseScrollParent;

const scrollParents: ScrollParent[] = [
    baseScrollParent
];

function render(): void {
    const renders: [any, string, string][] = [];
    for (let i = scrollParents.length - 1; i >= 0; i--) {
        scrollParents[i].render(renders);
    }
    for (let i = renders.length - 1; i >= 0; i--) {
        const render = renders[i];
        const result = render[2];
        const object = render[0];
        if (Array.isArray(result)) {
            object[render[1]].apply(object, result);
        } else{
            object[render[1]] = result;
        }
    }
}

let stop: boolean = false;
let started: boolean = false;
function startLoop(): void {
    stop = false;
    if (started) {
        return;
    }
    started = true;
    requestAnimationFrame(function fn(): void {
        if (!stop) {
            render();
            requestAnimationFrame(fn);
        }
    });
}
function endLoop(): void {
    stop = true;
    started = false;
}

function getRefreshedParent(element: HTMLElement): ScrollParent {
    if (element[SCROLL_PARENT]) {
        return element[SCROLL_PARENT]!.refresh();
    }
    const parent = new ScrollParent(element);
    scrollParents.push(parent);
    return parent;
}

function parse(element: HTMLElement, parent: ScrollParent, subtree: boolean = true): void {
    let scrollOptions: { [key: string]: [FramePosition, string | typeof EXTRAPOLATE][] } | null = null;
    Array.prototype.forEach.call(element.attributes, (attr: Attr) => {
        if (!attr.name.match(/^data-scroll[\-\.]/)) {
            return;
        }
        const data: string = attr.name.substr(11);
        if (data === "-parent") {
            parent = getRefreshedParent(element);
        } else if (data === "-trigger") {
            let trigger: number = parseFloat(attr.value);
            if (!isNaN(trigger)) {
                parent = getRefreshedParent(element);
                parent.trigger = trigger;
            }
        } else if (data === "-bottom") {
            let bottom: number = parseFloat(attr.value);
            if (!isNaN(bottom)) {
                parent = getRefreshedParent(element);
                parent.bottomOffset = bottom;
            }
        } else if (data === "-top") {
            let top: number = parseFloat(attr.value);
            if (!isNaN(top)) {
                parent = getRefreshedParent(element);
                parent.topOffset = top;
            }
        } else {
            const dataSplit: string[] = data.split("-");
            dataSplit.shift();
            if (dataSplit.length > 2 || dataSplit.length === 0) {
                return;
            }
            if (scrollOptions == null) {
                scrollOptions = {};
            }
            // convert "_[a-z]" to "[A-Z]" and "__" to "_"
            const propertyName: string = dataSplit[0].replace(/(?:^|[\Wa-zA-Z])(_[a-zA-Z])/, function (_: string, g: string): string {
                return _.replace(g, g[1].toUpperCase());
            }).replace("__", "_");
            if (dataSplit.length === 1 && dataSplit[0].match(/(.*)\(\)$/)) {
                scrollOptions[propertyName] = [];
            } else {
                const frame: number = parseFloat(dataSplit[1]);
                if (!isNaN(frame)) {
                    scrollOptions[propertyName] = (scrollOptions[propertyName] || []).concat([ [ frame, attr.value ] ]);
                } else if (dataSplit[1] === "before") {
                    scrollOptions[propertyName] = (scrollOptions[propertyName] || []).concat([ [ "before", attr.value ] ]);
                } else if (dataSplit[1] === "after") {
                    scrollOptions[propertyName] = (scrollOptions[propertyName] || []).concat([ [ "after", attr.value ] ]);
                } else if (dataSplit[1] === "extrapolate") {
                    scrollOptions[propertyName] = (scrollOptions[propertyName] || []).concat([
                        [ 0, EXTRAPOLATE ], [ 1, EXTRAPOLATE ]
                    ]);
                }
            }
        }
    });
    if (scrollOptions != null) {
        element[SCROLL_PARENT] = parent;
        if (element[SCROLL_OBJECT]) {
            element[SCROLL_OBJECT]!.refresh(scrollOptions);
        } else {
            parent.children.push(new ScrollObject(element, scrollOptions));
        }
    }
    if (subtree) {
        Array.prototype.forEach.call(element.children, child => { parse(child, parent); });
    }
}

export function add(element: HTMLElement, subtree: boolean = true): void {
    let parent: HTMLElement | null = element;
    let firstScrollParent: ScrollParent | undefined = element[SCROLL_PARENT];
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
export function remove(element: HTMLElement, renderFrame: number | "before" | "after" | null = null): void {
    let scrollParent: ScrollParent | undefined = element[SCROLL_PARENT];
    let scrollObject: ScrollObject | undefined = element[SCROLL_OBJECT];
    if (scrollParent != null) {
        if (scrollParent.el === element) {
            let index: number = -1;
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
                const renders: [any, string, string][] = [];
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
        let index: number = -1;
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