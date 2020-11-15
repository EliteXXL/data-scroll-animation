# scroll-based HTMLElement property management
## Installation
`npm install data-scroll-animation`
## Usage
`data-scroll-parent` attribute
>Specifies the start and end point of nested animation

`data-scroll-top`
>Defines top offset in px

`data-scroll-bottom`
>Defines bottom offset in px

The animation begins at `start - topOffset` and ends at `end + bottomOffset`
```
┌-------------------> topOffset     = frame 0
|
|
╔═════════════════╗-> start
║                 ║
║      PARENT     ║
║                 ║
╚═════════════════╝-> end
|
|
└-------------------> bottomOffset  = frame 1
```

`data-scroll-(property)-(frame)="(value)"`
>Sets `property` of the attribute owner element to `value` at specified `frame`
>
>`property` have format `[property.]*property`, so `style.width` works as well `customProperty`
>
>`value` is linearly interpolated between frames
special `frame`s are "before" and "after"

`data-scroll-(method)()`
>Calls `method` every frame with frame number as first and only argument `method(frame: number): number`
```js
import * as ScrollAnimation from "data-scroll-animation";

ScrollAnimation.add(document.body); // adds all animation in the document
ScrollAnimation.add(document.querySelector("#animation")) // adds only the #animation element

ScrollAnimation.remove(document.querySelector("#element")) // removes only the #element element
```