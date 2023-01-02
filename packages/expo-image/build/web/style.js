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
        .flip-from-top {
          transition-property: transform;
          animation-fill-mode: forwards;
          transform-origin: top;
        }
        .flip-from-top-start:not(.transitioning) {
          transform: rotateX(90deg);
        }
        .flip-from-top-active {
          transform: rotateX(0);
        }
        .flip-from-top-end {
          transform: rotateX(-90deg);
        }
        .flip-from-bottom {
          transition-property: transform;
          animation-fill-mode: forwards;
          transform-origin: bottom;
        }
        .flip-from-bottom-start:not(.transitioning) {
          transform: rotateX(-90deg);
        }
        .flip-from-bottom-active {
          transform: rotateX(0);
        }
        .flip-from-bottom-end {
          transform: rotateX(90deg);
        }
        .flip-from-left {
          transition-property: transform;
          animation-fill-mode: forwards;
          transform-origin: left;
        }
        .flip-from-left-start:not(.transitioning) {
          transform: rotateY(-90deg);
        }
        .flip-from-left-active {
          transform: rotateY(0);
        }
        .flip-from-left-end {
          transform: rotateY(90deg);
        }
        .flip-from-right {
          transition-property: transform;
          animation-fill-mode: forwards;
          transform-origin: right;
        }
        .flip-from-right-start:not(.transitioning) {
          transform: rotateY(90deg);
        }
        .flip-from-right-active {
          transform: rotateY(0);
        }
        .flip-from-right-end {
          transform: rotateY(-90deg);
        }
          `;
export default function loadStyle() {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = style;
    document.head.appendChild(styleTag);
}
//# sourceMappingURL=style.js.map