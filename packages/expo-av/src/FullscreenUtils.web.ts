declare global {
  interface Document {
    fullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
    webkitFullscreenElement?: Element | null;
    msExitFullscreen?(): void;
  }
}

/**
 * Detect if the browser supports the standard fullscreen API on the given
 * element:
 * https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
 */
const supportsFullscreenAPI = (element: HTMLMediaElement): boolean =>
  'requestFullscreen' in element;

interface WebkitFullscreenElement extends HTMLMediaElement {
  webkitExitFullScreen?(): void;
  webkitEnterFullScreen?(): void;
}

/**
 * Detect if the browser supports the non-standard webkit fullscreen API on the
 * given element (looking at you, Safari).
 */
const supportsWebkitFullscreenAPI = (
  element: HTMLMediaElement
): element is WebkitFullscreenElement => 'webkitEnterFullScreen' in element;

interface IEFullscreenElement extends HTMLMediaElement {
  msRequestFullscreen?(): void;
}

/**
 * Detect if the browser supports the non-standard ms fullscreen API on the
 * given element (looking at you, IE11).
 */
const supportsMsFullscreenAPI = (element: HTMLMediaElement): element is IEFullscreenElement =>
  'msRequestFullscreen' in element;

/**
 * Detect if the browser supports the `webkitFullscreenChange` event. This is
 * a non-standard event added to Safari on macOS by Apple:
 * https://developer.apple.com/documentation/webkitjs/document/1631998-onwebkitfullscreenchange
 */
const supportsWebkitFullscreenChangeEvent = (): boolean =>
  supportsEvent('video', 'webkitfullscreenchange');

/**
 * A helper that adds an event listener to an element. The key value-add over
 * the native addEventListener is that it returns a function that will remove
 * the event listener. This allows the setup and teardown logic for a listener
 * to be easily colocated.
 */
function addEventListener(
  element: Document | HTMLElement,
  eventName: string,
  listener: EventListenerOrEventListenerObject
): () => any {
  element.addEventListener(eventName, listener);
  return () => element.removeEventListener(eventName, listener);
}

/**
 * Detect if the browser supports an event on a particular element type.
 */
const supportsEvent = (elementName: string, eventName: string): boolean => {
  // Detect if the browser supports the event by attempting to add a handler
  // attribute for that event to the provided element. If the event is supported
  // then the browser will accept the attribute and report the type of the
  // attribute as "function". See: https://stackoverflow.com/a/4562426/2747759
  const element = document.createElement(elementName);
  element.setAttribute('on' + eventName, 'return;');
  return typeof element[('on' + eventName) as keyof Element] === 'function';
};

/**
 * Switches a video element into fullscreen.
 */
export async function requestFullscreen(element: HTMLMediaElement): Promise<void> {
  if (supportsFullscreenAPI(element)) {
    return element.requestFullscreen();
  } else if (supportsWebkitFullscreenAPI(element)) {
    // This API is synchronous so no need to return the result
    element['webkitEnterFullScreen']?.();
  } else if (supportsMsFullscreenAPI(element)) {
    // This API is synchronous so no need to return the result
    element['msRequestFullscreen']?.();
  } else {
    throw new Error('Fullscreen not supported');
  }
}

/**
 * Switches a video element out of fullscreen.
 */

export async function exitFullscreen(element: HTMLMediaElement): Promise<void> {
  if (supportsFullscreenAPI(element)) {
    return document.exitFullscreen();
  } else if (supportsWebkitFullscreenAPI(element)) {
    // This API is synchronous so no need to return the result
    element['webkitExitFullScreen']?.();
  } else if (supportsMsFullscreenAPI(element)) {
    // This API is synchronous so no need to return the result
    document['msExitFullscreen']?.();
  } else {
    throw new Error('Fullscreen not supported');
  }
}

/**
 * Listens for fullscreen change events on a video element. The provided
 * callback will be called with `true` when the video is switched into
 * fullscreen and `false` when the video is switched out of fullscreen.
 */
export function addFullscreenListener(
  element: HTMLVideoElement,
  callback: (isFullscreen: boolean) => void
): () => any {
  if (supportsFullscreenAPI(element)) {
    // Used by browsers that support the official spec
    return addEventListener(element, 'fullscreenchange', (event) =>
      callback(document.fullscreenElement === event.target)
    );
  } else if (supportsWebkitFullscreenAPI(element) && supportsWebkitFullscreenChangeEvent()) {
    // Used by Safari on macOS
    return addEventListener(element, 'webkitfullscreenchange', (event) =>
      callback(document['webkitFullscreenElement'] === event.target)
    );
  } else if (supportsWebkitFullscreenAPI(element)) {
    // Used by Safari on iOS
    const removeBeginListener = addEventListener(element, 'webkitbeginfullscreen', () =>
      callback(true)
    );
    const removeEndListener = addEventListener(element, 'webkitendfullscreen', () =>
      callback(false)
    );
    return () => {
      removeBeginListener();
      removeEndListener();
    };
  } else if (supportsMsFullscreenAPI(element)) {
    // Used by IE11
    return addEventListener(document, 'MSFullscreenChange', (event) =>
      callback(document['msFullscreenElement'] === event.target)
    );
  } else {
    return () => {};
  }
}
