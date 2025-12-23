export interface PageEventPayload {
  pathname: string;
  screenId: string;
}

const availableEvents = ['pageWillRender', 'pageFocused', 'pageBlurred', 'pageRemoved'] as const;

export type RouterNavigationEventsMap = {
  [K in (typeof availableEvents)[number]]: (payload: PageEventPayload) => void;
};

export const internal_navigationEventEmitter =
  new globalThis.expo.EventEmitter<RouterNavigationEventsMap>();

let _areNavigationEventsEnabled = false;

export const areNavigationEventsEnabled = () => _areNavigationEventsEnabled;

export const unstable_navigationEvents = {
  addListener: internal_navigationEventEmitter.addListener.bind(internal_navigationEventEmitter),
  removeListener: internal_navigationEventEmitter.removeListener.bind(
    internal_navigationEventEmitter
  ),
  enableNavigationEvents: () => {
    _areNavigationEventsEnabled = true;
  },
};
