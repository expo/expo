import * as React from 'react';

// utility function for capturing all push and pop stack events
// components can subscribe to internal state to push and pop their own views depending on use case
// e.g a modal stack, a screen stack, a toast stack, etc

export type IStackEvent = 'pushstart' | 'pushend' | 'popstart' | 'popend' | 'replace';

export type StackItemStatus = 'pushing' | 'popping' | 'settled';

export type ListenerFn<T> = ({
  items,
}: {
  action: IStackEvent;
  key: string;
  items: StackItem<T>[];
  getItemByKey: (key: string) => T | undefined;
}) => void;

export type StackItem<T> = T & { key: string; status: StackItemStatus };
export type IReplaceOptions<T> = T & { replaceAmount?: number; key?: string };
export type IPushOptions<T> = T & { key?: string };
export interface IStack<T> {
  push: (pushOptions: IPushOptions<T>) => Promise<string>;
  pop: (amount?: number) => Promise<string[]>;
  replace: (replaceOptions: IReplaceOptions<T>) => Promise<any>;
  onPushEnd: (key: string) => void;
  onPopEnd: (key: string) => void;
  subscribe: (listener: ListenerFn<T>) => () => void;
  getState: () => {
    items: StackItem<T>[];
    getItemByKey: (key: string) => T | undefined;
  };
}

const generateRouteKey = () => `${new Date().getTime()}`;

export function createAsyncStack<T>(): IStack<T> {
  let keys: string[] = [];
  const lookup: Record<string, StackItem<T>> = {};

  const pushResolvers: Record<string, Function> = {};
  const popResolvers: Record<string, Function> = {};

  let listeners: any[] = [];

  function push(pushOptions: IPushOptions<T>) {
    const key = pushOptions.key || generateRouteKey();

    if (keys.includes(key)) {
      return Promise.resolve(key);
    }

    keys.push(key);

    lookup[key] = {
      ...pushOptions,
      key,
      status: 'pushing',
    };

    const promise = new Promise<string>((resolve) => {
      pushResolvers[key] = resolve;
    });

    emit('pushstart', key);

    return promise;
  }

  function onPushEnd(key: string) {
    const item = lookup[key];

    if (item) {
      item.status = 'settled';

      emit('pushend', key);

      const resolver = pushResolvers[key];

      if (resolver) {
        resolver(key);
      }
    }
  }

  function pop(amount = 1, startIndex = 0) {
    const promises = [];

    if (amount === -1) {
      // pop them all
      amount = keys.length;
    }

    for (let i = 1; i <= amount; i++) {
      const key = keys[keys.length - startIndex - i];
      const item = lookup[key];

      if (item) {
        item.status = 'popping';

        const promise = new Promise((resolve) => {
          popResolvers[key] = resolve;
        });

        promises.push(promise);
        emit('popstart', key);
      }
    }

    return Promise.all(promises) as Promise<string[]>;
  }

  function onPopEnd(key: string) {
    keys = keys.filter((k) => k !== key);

    const resolver = popResolvers[key];

    if (resolver) {
      resolver(key);
    }

    delete popResolvers[key];
    delete pushResolvers[key];

    emit('popend', key);
  }

  async function replace(replaceOptions: IReplaceOptions<T>) {
    const itemsToPop = replaceOptions.replaceAmount != null ? replaceOptions.replaceAmount : 1;

    const promise2 = await push(replaceOptions);
    const promise1 = await pop(itemsToPop, 1);

    return Promise.all([promise2, promise1]);
  }

  function subscribe(listener: any) {
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }

  function emit(action: IStackEvent, key: string) {
    listeners.forEach((listener) => {
      const state = getState();
      listener({ ...state, key, action });
    });
  }

  function getItemByKey(key: string) {
    return lookup[key];
  }

  function getState() {
    const items = keys.map((key) => lookup[key]);

    return {
      items,
      getItemByKey,
    };
  }

  return {
    push,
    onPushEnd,
    pop,
    onPopEnd,
    replace,
    subscribe,
    getState,
  };
}

export function useStackItems<T>(stack: IStack<T>) {
  const [items, setItems] = React.useState(() => stack.getState().items);

  React.useEffect(() => {
    const unsubscribe = stack.subscribe(({ items }) => {
      setItems(items);
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [stack]);

  return items;
}
