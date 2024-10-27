class DOMNode {
  nodeName: string;

  constructor(nodeName: string) {
    this.nodeName = nodeName;
  }

  get ownerDocument() {
    return window.document;
  }

  appendChild(element: any) {
    // unimplemented
  }
}

class DOMElement extends DOMNode {
  style = {};
  // emitter = new EventEmitter();
  constructor(tagName: string) {
    super(tagName.toUpperCase());
  }

  get tagName() {
    return this.nodeName;
  }

  insertBefore = () => {};
  getContext() {
    // if (global.canvasContext) {
    //   return global.canvasContext;
    // }
    return {
      fillRect: () => {},
      drawImage: () => {},
      getImageData: () => {},
      getContextAttributes: () => ({
        stencil: true,
      }),
      getExtension: () => ({
        loseContext: () => {},
      }),
    };
  }

  addEventListener(eventName: string, listener: () => void) {
    // this.emitter.addListener(eventName, listener);
  }

  removeEventListener(eventName: string, listener: () => void) {
    // this.emitter.removeListener(eventName, listener);
  }

  get clientWidth() {
    return this.innerWidth;
  }
  get clientHeight() {
    return this.innerHeight;
  }

  get innerWidth() {
    return window.innerWidth;
  }
  get innerHeight() {
    return window.innerHeight;
  }
}

class DOMDocument extends DOMElement {
  body = new DOMElement('BODY');

  constructor() {
    super('#document');
  }

  createElement(tagName: string) {
    return new DOMElement(tagName);
  }

  createElementNS(tagName: string) {
    const canvas = this.createElement(tagName);
    canvas.getContext = () => ({
      fillRect: () => ({}),
      drawImage: () => ({}),
      getImageData: () => ({}),
      getContextAttributes: () => ({
        stencil: true,
      }),
      getExtension: () => ({
        loseContext: () => ({}),
      }),
    });
    // @ts-ignore
    canvas.toDataURL = () => ({});

    return canvas;
  }

  getElementById(id: string) {
    return new DOMElement('div');
  }
}

// @ts-ignore
process.browser = true;

// @ts-ignore
window.emitter = window.emitter || {}; // new EventEmitter();
window.addEventListener =
  window.addEventListener || ((eventName: string, listener: () => void) => {});

window.removeEventListener =
  window.removeEventListener || ((eventName: string, listener: () => void) => {});

// @ts-ignore
window.document = new DOMDocument();

// @ts-ignore
window.document.body = new DOMElement('body');

// This could be made better, but I'm not sure if it'll matter for PIXI
// @ts-ignore
global.navigator.userAgent = 'iPhone';
// @ts-ignore
global.userAgent = global.navigator.userAgent;

class HTMLImageElement2 {
  align: string;
  alt: null;
  border: null;
  complete: boolean;
  crossOrigin: string;
  localUri: string;
  lowSrc: string;
  currentSrc: string;
  src: string;
  width: number;
  height: number;
  isMap: boolean;

  constructor(props: { localUri: string; width: number; height: number }) {
    this.align = 'center';
    this.alt = null;
    this.border = null;
    this.complete = true;
    this.crossOrigin = '';
    this.localUri = props.localUri;
    this.lowSrc = props.localUri;
    this.currentSrc = props.localUri;
    this.src = props.localUri;
    this.width = props.width;
    this.height = props.height;
    this.isMap = true;
  }
}

// @ts-ignore
global.Image = HTMLImageElement2;
// @ts-ignore
global.HTMLImageElement = HTMLImageElement2;
