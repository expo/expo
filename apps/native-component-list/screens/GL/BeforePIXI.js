import { Image, Dimensions } from 'react-native';

class DOMNode {
  constructor(nodeName) {
    this.nodeName = nodeName;
  }

  get ownerDocument() {
    return window.document;
  }

  appendChild(element) {
    // unimplemented
  }
}

class DOMElement extends DOMNode {
  style = {};
  // emitter = new EventEmitter();
  constructor(tagName) {
    return super(tagName.toUpperCase());
  }

  get tagName() {
    return this.nodeName;
  }

  insertBefore = () => {};
  getContext(contextType) {
    // if (global.canvasContext) {
    //   return global.canvasContext;
    // }
    return {
      fillRect: _ => {},
      drawImage: _ => {},
      getImageData: _ => {},
      getContextAttributes: _ => ({
        stencil: true,
      }),
      getExtension: _ => ({
        loseContext: _ => {},
      }),
    };
  }

  addEventListener(eventName, listener) {
    // this.emitter.addListener(eventName, listener);
  }

  removeEventListener(eventName, listener) {
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

  createElement(tagName) {
    return new DOMElement(tagName);
  }

  createElementNS(tagName) {
    const canvas = this.createElement(tagName);
    canvas.getContext = () => ({
      fillRect: _ => ({}),
      drawImage: _ => ({}),
      getImageData: _ => ({}),
      getContextAttributes: _ => ({
        stencil: true,
      }),
      getExtension: _ => ({
        loseContext: _ => ({}),
      }),
    });
    canvas.toDataURL = _ => ({});

    return canvas;
  }

  getElementById(id) {
    return new DOMElement('div');
  }
}

process.browser = true;

window.emitter = window.emitter || {}; // new EventEmitter();
window.addEventListener = window.addEventListener || ((eventName, listener) => {});

window.removeEventListener = window.removeEventListener || ((eventName, listener) => {});

window.document = new DOMDocument();
window.document.body = new DOMElement('body');
window.location = 'data:'; // <- Not sure about this... or anything for that matter ¯\_(ツ)_/¯
global.userAgent = global.navigator.userAgent = 'iPhone'; // <- This could be made better, but I'm not sure if it'll matter for PIXI

class HTMLImageElement extends Image {
  constructor(props) {
    super();
    this.align = 'center';
    this.alt = null;
    this.border = null;
    this.complete = true;
    this.crossOrigin = '';
    this.localUri = this.lowSrc = this.currentSrc = this.src = props.localUri;
    this.width = props.width;
    this.height = props.height;
    this.isMap = true;
  }
}
global.HTMLImageElement = global.Image = HTMLImageElement;
global.performance = null;
