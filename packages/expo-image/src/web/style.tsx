const style = `
.expo-image-container .cross-dissolve {
  transition-property: opacity;
  animation-fill-mode: forwards;
}
.expo-image-container .cross-dissolve-start:not(.transitioning) {
  opacity: 0;
}
.expo-image-container .cross-dissolve-active {
  opacity: 1;
}
.expo-image-container .cross-dissolve-end {
  opacity: 0;
}
.expo-image-container .flip-from-left {
  transition-property: transform, opacity;
  transition-timing-function: var(--expo-image-timing,linear), steps(2, jump-none) !important;
  transform-origin: center;

}
.expo-image-container .flip-from-left-container {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  perspective: 1000px;
}
.expo-image-container .flip-from-left-start:not(.transitioning) {
  transform:  translateZ(calc(var(--expo-image-width,1000px) * -1.25)) rotateY(-180deg);
  opacity: 0;
}
.expo-image-container .flip-from-left-active {
  transform: translateZ(0px) rotateY(0) ;
  opacity:1;
}
.expo-image-container .flip-from-left-end {
  transform:  translateZ(calc(var(--expo-image-width,1000px) * -1.25)) rotateY(180deg);
  opacity: 0;
}
.expo-image-container .flip-from-right {
  transition-property: transform, opacity;
  transition-timing-function: var(--expo-image-timing,linear), steps(2, jump-none) !important;
  transform-origin: center;
}
.expo-image-container .flip-from-right-container {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  perspective: 1000px;
}
.expo-image-container .flip-from-right-start:not(.transitioning) {
  transform:  translateZ(calc(var(--expo-image-width,1000px) * -1.25)) rotateY(180deg);
  opacity: 0;
}
.expo-image-container .flip-from-right-active {
  transform: translateZ(0px) rotateY(0) ;
  opacity:1;
}
.expo-image-container .flip-from-right-end {
  transform:  translateZ(calc(var(--expo-image-width,1000px) * -1.25)) rotateY(-180deg);
  opacity: 0;
}
.expo-image-container .flip-from-top {
  transition-property: transform, opacity;
  transition-timing-function: var(--expo-image-timing,linear), steps(2, jump-none) !important;
  transform-origin: center;
}
.expo-image-container .flip-from-top-container {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  perspective: 1000px;
}
.expo-image-container .flip-from-top-start:not(.transitioning) {
  transform:  translateZ(calc(var(--expo-image-height,1000px) * -1.5)) rotateX(180deg);
  opacity: 0;
}
.expo-image-container .flip-from-top-active {
  transform: translateZ(0px) rotateX(0) ;
  opacity:1;
}
.expo-image-container .flip-from-top-end {
  transform:  translateZ(calc(var(--expo-image-height,1000px) * -1.5)) rotateX(-180deg);
  opacity: 0;
}
.expo-image-container .flip-from-bottom {
  transition-property: transform, opacity;
  transition-timing-function: var(--expo-image-timing,linear), steps(2, jump-none) !important;
  transform-origin: center;
}
.expo-image-container .flip-from-bottom-container {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  perspective: 1000px;
}
.expo-image-container .flip-from-bottom-start:not(.transitioning) {
  transform:  translateZ(calc(var(--expo-image-height,1000px) * -1.25)) rotateX(-180deg);
  opacity: 0;
}
.expo-image-container .flip-from-bottom-active {
  transform: translateZ(0px) rotateX(0) ;
  opacity:1;
}
.expo-image-container .flip-from-bottom-end {
  transform:  translateZ(calc(var(--expo-image-height,1000px) * -1.25)) rotateX(180deg);
  opacity: 0;
}
.expo-image-container .image-timing-linear {
  --expo-image-timing: linear;
}
.expo-image-container .image-timing-ease-in {
  --expo-image-timing: ease-in;
}
.expo-image-container .image-timing-ease-out {
  --expo-image-timing: ease-out;
}
.expo-image-container .image-timing-ease-in-out {
  --expo-image-timing: ease-in-out;
}
`;
export default function loadStyle() {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
}
