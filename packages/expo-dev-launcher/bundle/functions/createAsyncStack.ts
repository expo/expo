import * as React from 'react';
import { Animated } from 'react-native';

export type StackAction = 'pushstart' | 'pushend' | 'popstart' | 'popend';
export type Status = 'pushing' | 'popping' | 'settled' | 'popped';

export type StackItemComponent<T = any> = React.JSXElementConstructor<T>;

export type StackEvent<T = any> = {
  state: StackState<T>;
  event: {
    action: StackAction;
    key: string;
  };
};

type AValue = Animated.Value;

export type StackItem<T = any> = {
  key: string;
  status: Status;
  promise: Promise<StackItem<T>>;
  pop: () => void;
  onPushEnd: () => void;
  onPopEnd: () => void;
  data: T;
  animatedValue: AValue;
};

export type StackState<T = any> = {
  items: StackItem<T>[];
  lookup: Record<string, StackItem<T>>;
  getItemByKey: (key: string) => StackItem<T> | null;
};

export type Stack<T> = {
  push: (data?: T | undefined) => StackItem<T>;
  pop: (amount?: number) => StackItem[];
  subscribe: (listener: (state: StackEvent<T>) => void) => () => void;
  getState: () => StackState;
};

export function createAsyncStack<T = any>() {
  let keys: string[] = [];
  const lookup: Record<string, StackItem<T>> = {};
  let count = 0;

  const pushResolvers: Record<string, any> = {};
  const popResolvers: Record<string, Function> = {};

  let listeners: any[] = [];

  function push(data?: T) {
    count += 1;
    const key = '' + count;

    keys.push(key);

    const promise = new Promise<StackItem<T>>((resolve) => {
      pushResolvers[key] = resolve;
    });

    const item: StackItem<T> = {
      key,
      promise,
      data,
      status: 'pushing' as Status,
      pop: () => pop(`${key}`),
      onPushEnd: () => onPushEnd(key),
      onPopEnd: () => onPopEnd(key),
      animatedValue: new Animated.Value(0),
    };

    if (data) {
      item.data = data;
    }

    lookup[key] = item;

    emit('pushstart', key);

    return item;
  }

  function onPushEnd(key: string) {
    const item = lookup[key];

    if (item.status === 'pushing') {
      item.status = 'settled';

      const resolver = pushResolvers[key];

      if (resolver) {
        resolver(getItemByKey(key));
        delete pushResolvers[key];
      }

      emit('pushend', key);
    }

    return item;
  }

  function pop(amount: number | string = 1) {
    const items: StackItem[] = [];

    if (typeof amount === 'string') {
      const key = amount;
      const item = lookup[key];

      if (item) {
        if (item.status === 'pushing') {
          onPushEnd(key);
        }

        item.status = 'popping';

        const promise = new Promise<StackItem<T>>((resolve) => {
          popResolvers[key] = resolve;
        });

        item.promise = promise;

        emit('popstart', key);
        items.push(item);
      }

      return items;
    }

    if (amount === -1) {
      // pop them all
      amount = keys.length;
    }

    let startIndex = keys.length - 1;

    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      const item = lookup[key];

      if (item && (item.status === 'settled' || item.status === 'pushing')) {
        startIndex = i;
        break;
      }
    }

    for (let i = startIndex; i > startIndex - amount; i--) {
      const key = keys[i];
      const item = lookup[key];

      if (item) {
        if (item.status === 'pushing') {
          onPushEnd(key);
        }

        item.status = 'popping';

        const promise = new Promise<StackItem<T>>((resolve) => {
          popResolvers[key] = resolve;
        });

        item.promise = promise;

        emit('popstart', key);
        items.push(item);
      }
    }

    return items;
  }

  function onPopEnd(key: string) {
    const item = lookup[key];
    keys = keys.filter((k) => k !== key);

    const resolver = popResolvers[key];

    if (resolver) {
      resolver(getItemByKey(key));
      delete popResolvers[key];
    }

    item.status = 'popped';
    emit('popend', key);

    return item;
  }

  function subscribe(listener: (state: StackEvent<T>) => void) {
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }

  function emit(action: StackAction, key: string) {
    listeners.forEach((listener) => {
      const state = getState();
      const event = { key, action };
      listener({ state, event });
    });
  }

  function getItemByKey(key: string) {
    return lookup[key];
  }

  function getState(): StackState {
    const items = keys.map((key) => lookup[key]);

    return {
      items,
      lookup,
      getItemByKey,
    };
  }

  return {
    push,
    pop,
    subscribe,
    getState,
  };
}

export function useStackItems<T>(stack: Stack<T>) {
  const [items, setItems] = React.useState<StackItem<T>[]>(stack.getState().items);

  React.useEffect(() => {
    const unsubscribe = stack.subscribe(({ state }) => {
      setItems(state.items);
    });

    return () => unsubscribe();
  }, []);

  return items;
}
