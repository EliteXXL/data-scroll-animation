type FramePosition = number | "before" | "after";
declare const SCROLL_OBJECT: unique symbol;
declare const SCROLL_PARENT: unique symbol;
declare global {
    interface HTMLElement {
        [SCROLL_OBJECT]: ScrollObject | undefined;
        [SCROLL_PARENT]: ScrollParent | undefined;
    }
}
declare class ScrollObject {
    readonly el: HTMLElement;
    constructor(el: HTMLElement, frames: {
        [key: string]: [
            FramePosition,
            string
        ][];
    });
    refresh(frames: {
        [key: string]: [
            FramePosition,
            string
        ][];
    }): ScrollObject;
    _needUpdateAt: [
        boolean,
        number | null,
        number | null,
        boolean
    ];
    _frames: [
        () => [
            any,
            string
        ],
        boolean,
        (frame: FramePosition) => string
    ][];
    _lastRenderFrame: FramePosition | null;
    render(frame: FramePosition, renders: [
        any,
        string,
        string | any[]
    ][], force?: boolean): [
        any,
        string,
        string | any[]
    ][];
}
declare class ScrollParent {
    readonly el: HTMLElement;
    constructor(el: HTMLElement);
    refresh(): ScrollParent;
    children: ScrollObject[];
    trigger: number;
    topOffset: number;
    bottomOffset: number;
    _lastPosition: FramePosition | null;
    _computedStyle: CSSStyleDeclaration;
    _parents: HTMLElement[];
    _getRectTop(): number;
    render(renders: [
        any,
        string,
        string | any[]
    ][], force?: boolean): [
        any,
        string,
        string | any[]
    ][];
    remove(obj: ScrollObject): void;
    add(obj: ScrollObject): void;
}
declare function add(element: HTMLElement, subtree?: boolean): void;
declare function remove(element: HTMLElement, renderFrame?: number | "before" | "after" | null): void;
export { add, remove };
