// React Native's FormData implementation is missing several methods that are used in React for server actions.
// https://github.com/facebook/react-native/blob/42dcfdd2cdb59fe545523cb57db6ee32a96b9298/packages/react-native/Libraries/Network/FormData.js#L1
// https://github.com/facebook/react/blob/985747f81033833dca22f30b0c04704dd4bd3714/packages/react-client/src/ReactFlightReplyClient.js#L212

type ReactNativeFormDataInternal = FormData & {
  _parts: [string, string | Blob][];
};

function ensureMinArgCount(name: string, args: any[], expected: number) {
  if (args.length < expected) {
    const argName = expected === 2 ? 'arguments' : 'argument';
    // Matches the errors in Chrome.
    throw new TypeError(
      `Failed to execute '${name}' on 'FormData': ${expected} ${argName} required, but only ${args.length} present.`
    );
  }
}

function normalizeArgs(name: string, value: any): [string, File | string] {
  if (typeof value !== 'object') {
    value = String(value);
  }
  // TODO: Add Blob normalization in the future, right now this isn't supported to ensure parity with the rest of the FormData
  // implementation in React Native.
  // https://github.com/facebook/react-native/blob/42dcfdd2cdb59fe545523cb57db6ee32a96b9298/packages/react-native/Libraries/Network/FormData.js#L64

  return [String(name), value];
}

export function installFormDataPatch(formData: typeof FormData) {
  formData.prototype.append ??= function append(this: ReactNativeFormDataInternal, ...props) {
    ensureMinArgCount('append', props, 2);
    const [name, value] = props;
    this._parts.push(normalizeArgs(name, value));
  };

  // @ts-ignore: DOM.iterable is disabled for jest compat
  formData.prototype.set ??= function set(this: ReactNativeFormDataInternal, ...props) {
    ensureMinArgCount('set', props, 2);
    const [name, value] = props;
    const args = normalizeArgs(name, value);
    let replaced = false;

    for (let i = 0; i < this._parts.length; i++) {
      if (this._parts[i][0] === args[0]) {
        if (!replaced) {
          this._parts[i] = args;
          replaced = true;
        } else {
          this._parts.splice(i, 1);
          i--;
        }
      }
    }

    if (!replaced) {
      this._parts.push(args);
    }
  };

  // @ts-ignore: DOM.iterable is disabled for jest compat
  formData.prototype.delete ??= function (this: ReactNativeFormDataInternal, ...props) {
    ensureMinArgCount('delete', props, 1);
    let [name] = props;
    name = String(name);
    for (let i = 0; i < this._parts.length; i++) {
      if (this._parts[i][0] === name) {
        this._parts.splice(i, 1);
        i--;
      }
    }
  };

  // @ts-ignore: DOM.iterable is disabled for jest compat
  formData.prototype.get ??= function (
    this: ReactNativeFormDataInternal,
    ...props
  ): FormDataEntryValue | null {
    ensureMinArgCount('get', props, 1);
    let [name] = props;
    name = String(name);
    for (const part of this._parts) {
      if (part[0] === name) {
        // @ts-expect-error: We don't perform correct normalization when setting the args so the return value will
        // not be a normalized File object.
        return part[1];
      }
    }
    return null;
  };

  // @ts-ignore: DOM.iterable is disabled for jest compat
  formData.prototype.has ??= function (this: ReactNativeFormDataInternal, ...props) {
    ensureMinArgCount('has', props, 1);
    let [name] = props;
    name = String(name);
    for (const part of this._parts) {
      if (part[0] === name) {
        return true;
      }
    }
    return false;
  };

  // Required for RSC: https://github.com/facebook/react/blob/985747f81033833dca22f30b0c04704dd4bd3714/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js#L1056
  // @ts-ignore: DOM.iterable is disabled for jest compat
  formData.prototype.forEach ??= function forEach(this: ReactNativeFormDataInternal, ...props) {
    ensureMinArgCount('forEach', props, 1);

    const [callback, thisArg] = props;
    if (typeof callback !== 'function') {
      throw new TypeError(
        `Failed to execute 'forEach' on 'FormData': parameter 1 is not of type 'Function'.`
      );
    }
    for (const part of this._parts) {
      callback.call(thisArg, part[1], part[0], this);
    }
  };

  // Required for RSC: https://github.com/facebook/react/blob/985747f81033833dca22f30b0c04704dd4bd3714/packages/react-server/src/ReactFlightServer.js#L2117
  formData.prototype.entries = function* entries(
    this: ReactNativeFormDataInternal
  ): IterableIterator<[string, FormDataEntryValue]> {
    for (const part of this._parts) {
      // @ts-expect-error: We don't perform correct normalization when setting the args so the return value will
      // not be a normalized File object.
      yield part;
    }
  };

  formData.prototype.keys ??= function* keys(this: ReactNativeFormDataInternal) {
    for (const part of this._parts) {
      yield part[0];
    }
  };

  formData.prototype.values ??= function* values(
    this: ReactNativeFormDataInternal
  ): IterableIterator<FormDataEntryValue> {
    for (const part of this._parts) {
      // @ts-expect-error: We don't perform correct normalization when setting the args so the return value will
      // not be a normalized File object.
      yield part[1];
    }
  };

  formData.prototype[Symbol.iterator] = formData.prototype.entries;

  return formData;
}
