type FramePosition = number | "before" | "after";

function computeFrames(frames: [ FramePosition, string ][]): (frame: FramePosition) => string {
    let staticString: string | null = null;
    let indexes: number[] = [];
    let frameNumbers: number[] = [];
    let frameValues: number[][] = [];
    let beforeValue: string | null = null;
    let afterValue: string | null = null;
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
            if (frame[0] === "after") {
                afterValue = frame[1];
                return;
            } else if (frame[0] === "before") {
                beforeValue = frame[1];
                return;
            }
            let thisStaticString: string;
            frameNumbers.push(frame[0]);
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
            return (frameNumber: FramePosition) => {
                if (frameNumber === "before") {
                    if (beforeValue != null) {
                        return beforeValue;
                    }
                    return frames[0][1];
                } else if (frameNumber === "after") {
                    if (afterValue != null) {
                        return afterValue;
                    }
                    return frames[frames.length - 1][1];
                }
                const index: number = getNearestLeftIndexOf(frameNumber);
                if (index === -1) {
                    return "";
                }
                return frames[index][1];
            };
        }
    }
    if (frameValues.length === 0) {
        return (frameNumber: FramePosition) => {
            if (frameNumber === "before" && beforeValue != null) {
                return beforeValue;
            } else if (frameNumber === "after" && afterValue != null) {
                return afterValue;
            }
            return "";
        };
    }
    function constructString(values: number[]): string {
        const staticStringArray: string[] = staticString!.split("");
        for (let i: number = indexes.length - 1; i >= 0; i--) {
            staticStringArray.splice(indexes[i], 0, values[i].toString());
        }
        return staticStringArray.join("");
    }
    return (frameNumber: FramePosition) => {
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
        frameValues[index].forEach((value, v_index) => {
            const nextValue: number = frameValues[index + 1][v_index];
            computedValues.push(value + ((nextValue - value) * perc));
        });
        return constructString(computedValues);
    };
}

const SCROLL_OBJECT: unique symbol = Symbol("scroll-object");
const SCROLL_PARENT: unique symbol =  Symbol("scroll-parent");

class ScrollObject {
    constructor(readonly el: HTMLElement, frames: { [key: string]: [FramePosition, string][] }) {
        this.refresh(frames);
    }
    refresh(frames: { [key: string]: [FramePosition, string][] }): ScrollObject {
        this.el[SCROLL_OBJECT] = this;
        for (let key in frames) {
            if (!Object.prototype.hasOwnProperty.call(frames, key)) {
                continue;
            }
            this._frames[key] = computeFrames(frames[key]);
        }
        return this;
    }
    _frames: { [key: string]: (frame: FramePosition) => string } = {};
    render(frame: FramePosition): void {
        for (let key in this._frames) {
            if (!Object.prototype.hasOwnProperty.call(this._frames, key)) {
                continue;
            }

            let lastObject: any = this.el;
            const splitKey: string[] = key.split(".");
            const lastKey: string = splitKey.pop()!;
            splitKey.forEach(key => {
                if (lastObject == null) {
                    return;
                }
                lastObject = lastObject[key];
            });
            if (lastObject == null) {
                continue;
            }

            let match: RegExpMatchArray | null = lastKey.match(/(.*)\(\)$/);
            if (match) {
                lastObject[match[1]].apply(
                    lastObject,
                    [
                        frame,
                        ...this._frames[key](frame).split(",").map(t => t.trim()).filter(t => t !== "")
                    ]
                );
            } else {
                lastObject[lastKey] = this._frames[key](frame);
            }
            // console.log(key,
            // );
        }
    }
}

class ScrollParent {
    constructor(readonly el: HTMLElement) {
        el[SCROLL_PARENT] = this;
    }
    refresh(): ScrollParent {
        this._lastPosition = null;
        return this;
    }
    children: ScrollObject[] = [];
    trigger: number = 0;
    topOffset: number = 0;
    bottomOffset: number = 0;
    _lastPosition: FramePosition | null = null;
    render(force: boolean = false): void {
        if (this.children.length === 0) {
            return;
        }
        const rect: DOMRect = this.el.getBoundingClientRect();
        const trigger: number = document.documentElement.clientHeight * this.trigger;
        const top: number = rect.top - this.topOffset;
        const bottom: number = rect.bottom + this.bottomOffset;
        const position: number = (trigger - top) / (bottom - top);
        const actualPosition: FramePosition = position > 1 ? "after" : position < 0 ? "before" : position;
        if (actualPosition !== this._lastPosition || force) {
            this._lastPosition = actualPosition;
            this.children.forEach(child => {
                child.render(this._lastPosition!);
            });
            this.el.dispatchEvent(new CustomEvent("render", { detail: { position: this._lastPosition }, bubbles: false }));
        }
    }
    remove(obj: ScrollObject): void {
        let index: number = -1;
        if (this.children.some((child, i) => { index = i; return child === obj || child.el === obj.el; } )) {
            this.children.splice(index, 1);
        }
    }
    add(obj: ScrollObject): void {
        this.remove(obj);
        this.children.push(obj);
    }
}

const baseScrollParent: ScrollParent = new ScrollParent(document.documentElement);
document.body[SCROLL_PARENT] = baseScrollParent;

const scrollParents: ScrollParent[] = [
    baseScrollParent
];

function render(): void {
    scrollParents.forEach(parent => {
        parent.render();
    });
}

let stop: boolean = false;
let interval: number = -1;
function startLoop(): void {
    // if (interval !== -1) {
    //     return;
    // }
    stop = false;
    requestAnimationFrame(function fn(): void {
        render();
        if (!stop) {
            requestAnimationFrame(fn);
        }
    });
    // interval = setInterval(render, 20);
}
function endLoop(): void {
    // if (interval === -1) {
    //     return;
    // }
    // clearInterval(interval);
    // interval = -1;
    stop = true;
}

function parse(element: HTMLElement, parent: ScrollParent, subtree: boolean = true): void {
    let scrollOptions: { [key: string]: [FramePosition, string][] } | null = null;
    Array.prototype.forEach.call(element.attributes, (attr: Attr) => {
        if (!attr.name.match(/^data-scroll[\-\.]/)) {
            return;
        }
        const data: string = attr.name.substr(11);
        if (data === "-parent") {
            if (element[SCROLL_PARENT]) {
                parent = element[SCROLL_PARENT].refresh();
            } else {
                scrollParents.push(parent = new ScrollParent(element));
            }
        } else if (data === "-trigger") {
            let trigger: number = parseFloat(attr.value);
            if (!isNaN(trigger)) {
                if (element[SCROLL_PARENT]) {
                    parent = element[SCROLL_PARENT].refresh();
                } else {
                    scrollParents.push(parent = new ScrollParent(element));
                }
                parent.trigger = trigger;
            }
        } else if (data === "-bottom") {
            let bottom: number = parseFloat(attr.value);
            if (!isNaN(bottom)) {
                if (element[SCROLL_PARENT]) {
                    parent = element[SCROLL_PARENT].refresh();
                } else {
                    scrollParents.push(parent = new ScrollParent(element));
                }
                parent.bottomOffset = bottom;
            }
        } else if (data === "-top") {
            let top: number = parseFloat(attr.value);
            if (!isNaN(top)) {
                if (element[SCROLL_PARENT]) {
                    parent = element[SCROLL_PARENT].refresh();
                } else {
                    scrollParents.push(parent = new ScrollParent(element));
                }
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
                }
            }
        }
    });
    if (scrollOptions != null) {
        element[SCROLL_PARENT] = parent;
        if (element[SCROLL_OBJECT]) {
            element[SCROLL_OBJECT].refresh(scrollOptions);
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
    parse(element, firstScrollParent || baseScrollParent, subtree);
    if (scrollParents.length > 0) {
        startLoop();
    }
}
export function remove(element: HTMLElement, renderFrame: number | "before" | "after" | null = null): void {
    let scrollParent: ScrollParent = element[SCROLL_PARENT];
    let scrollObject: ScrollObject = element[SCROLL_OBJECT];
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
                scrollObject.render(renderFrame);
            }
        }
        delete element[SCROLL_PARENT];
        delete element[SCROLL_OBJECT];
    }
    Array.prototype.forEach.call(element.children, child => {
        remove(child);
    });
    if (scrollParents.length === 0) {
        endLoop();
    }
}