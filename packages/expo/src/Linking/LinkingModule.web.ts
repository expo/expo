import findIndex from 'array-find-index';
import invariant from 'invariant';

// TODO: Bacon: Is there enough coverage to use Array.prototype.findIndex() directly: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Browser_compatibility

type NativeEvent = { data: any; origin: string; source: any };
type EventType = { url: string; nativeEvent: NativeEvent };
type HandlerFunction = (event: EventType) => {};

// TODO: Bacon: Should we alias url to `hashchange` or `popstate`: https://stackoverflow.com/a/44318564/4047926

const EventTypes = ['url'];

const messageEventKey = 'message';

const listeners = [];

function _validateURL(url: string): void {
  invariant(typeof url === 'string', `Invalid URL: should be a string. Instead found: ${url}`);
  invariant(url, 'Invalid URL: cannot be empty');
}

export default {
  addEventListener(type: 'url', handler: HandlerFunction): void {
    invariant(
      EventTypes.indexOf(type) !== -1,
      `Linking.addEventListener(): ${type} is not a valid event`
    );
    const callback = nativeEvent => handler({ url: window.location.href, nativeEvent });
    listeners.push([handler, callback]);
    window.addEventListener(messageEventKey, callback, false);
  },
  removeEventListener(type: 'url', handler: HandlerFunction): void {
    invariant(
      EventTypes.indexOf(type) !== -1,
      `Linking.removeEventListener(): ${type} is not a valid event`
    );
    const listenerIndex = findIndex(listeners, pair => pair[0] === handler);
    invariant(
      listenerIndex !== -1,
      'cannot invoke Linking.removeEventListener with an unregistered event handler.'
    );
    const callback = listeners[listenerIndex][1];
    window.removeEventListener(messageEventKey, callback, false);
    listeners.splice(listenerIndex, 1);
  },
  async canOpenURL(url: string): Promise<boolean> {
    _validateURL(url);
    return true;
  },
  async getInitialURL(): Promise<string> {
    return window.location.href;
  },
  async openURL(url: string): Promise<void> {
    _validateURL(url);
    window.location.href = url;
  },
};
