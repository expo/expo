let location = new URL('', 'http://example.com');

let listeners: (() => void)[] = [];
let entries = [{ state: null, href: location.href }];
let index = 0;

let currentState: any = null;

const history = {
  get state() {
    return currentState;
  },

  pushState(state: any, _: string, path: string) {
    location = new URL(path, location.origin);

    currentState = state;
    entries = entries.slice(0, index + 1);
    entries.push({ state, href: location.href });
    index = entries.length - 1;
  },

  replaceState(state: any, _: string, path: string) {
    location = new URL(path, location.origin);

    currentState = state;
    entries[index] = { state, href: location.href };
  },

  go(n: number) {
    setTimeout(() => {
      if (
        (n > 0 && n < entries.length - index) ||
        (n < 0 && Math.abs(n) <= index)
      ) {
        index += n;
        const entry = entries[index];
        location = new URL(entry.href);
        currentState = entry.state;
        listeners.forEach((cb) => cb());
      }
    }, 0);
  },

  back() {
    this.go(-1);
  },

  forward() {
    this.go(1);
  },
};

const addEventListener = (type: 'popstate', listener: () => void) => {
  if (type === 'popstate') {
    listeners.push(listener);
  }
};

const removeEventListener = (type: 'popstate', listener: () => void) => {
  if (type === 'popstate') {
    listeners = listeners.filter((cb) => cb !== listener);
  }
};

export const window = {
  document: { title: '' },
  get location() {
    return location;
  },
  history,
  addEventListener,
  removeEventListener,
  get window() {
    return window;
  },
};
