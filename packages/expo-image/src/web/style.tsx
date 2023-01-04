const style = `
        .cross-dissolve {
          transition-property: opacity;
          animation-fill-mode: forwards;
        }
        .cross-dissolve-start:not(.transitioning) {
          opacity: 0;
        }
        .cross-dissolve-active {
          opacity: 1;
        }
        .cross-dissolve-end {
          opacity: 0;
        }
        .flip-from-left {
          transition-property: transform, opacity;
          transition-timing-function: var(--expo-image-timing,linear), steps(2, jump-none) !important;
          transform-origin: center;

        }
        .flip-from-left-container {
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          perspective: 1000px;
        }
        .flip-from-left-start:not(.transitioning) {
          transform:  translateZ(calc(var(--expo-image-width,1000px) * -1.25)) rotateY(-180deg);
          opacity: 0;
        }
        .flip-from-left-active {
          transform: translateZ(0px) rotateY(0) ;
          opacity:1;
        }
        .flip-from-left-end {
          transform:  translateZ(calc(var(--expo-image-width,1000px) * -1.25)) rotateY(180deg);
          opacity: 0;
        }
        .flip-from-right {
          transition-property: transform, opacity;
          transition-timing-function: var(--expo-image-timing,linear), steps(2, jump-none) !important;
          transform-origin: center;
        }
        .flip-from-right-container {
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          perspective: 1000px;
        }
        .flip-from-right-start:not(.transitioning) {
          transform:  translateZ(calc(var(--expo-image-width,1000px) * -1.25)) rotateY(180deg);
          opacity: 0;
        }
        .flip-from-right-active {
          transform: translateZ(0px) rotateY(0) ;
          opacity:1;
        }
        .flip-from-right-end {
          transform:  translateZ(calc(var(--expo-image-width,1000px) * -1.25)) rotateY(-180deg);
          opacity: 0;
        }
        .flip-from-top {
          transition-property: transform, opacity;
          transition-timing-function: var(--expo-image-timing,linear), steps(2, jump-none) !important;
          transform-origin: center;
        }
        .flip-from-top-container {
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          perspective: 1000px;
        }
        .flip-from-top-start:not(.transitioning) {
          transform:  translateZ(calc(var(--expo-image-height,1000px) * -1.5)) rotateX(180deg);
          opacity: 0;
        }
        .flip-from-top-active {
          transform: translateZ(0px) rotateX(0) ;
          opacity:1;
        }
        .flip-from-top-end {
          transform:  translateZ(calc(var(--expo-image-height,1000px) * -1.5)) rotateX(-180deg);
          opacity: 0;
        }
        .flip-from-bottom {
          transition-property: transform, opacity;
          transition-timing-function: var(--expo-image-timing,linear), steps(2, jump-none) !important;
          transform-origin: center;
        }
        .flip-from-bottom-container {
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          perspective: 1000px;
        }
        .flip-from-bottom-start:not(.transitioning) {
          transform:  translateZ(calc(var(--expo-image-height,1000px) * -1.25)) rotateX(-180deg);
          opacity: 0;
        }
        .flip-from-bottom-active {
          transform: translateZ(0px) rotateX(0) ;
          opacity:1;
        }
        .flip-from-bottom-end {
          transform:  translateZ(calc(var(--expo-image-height,1000px) * -1.25)) rotateX(180deg);
          opacity: 0;
        }
          `;
export default function loadStyle() {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
}
