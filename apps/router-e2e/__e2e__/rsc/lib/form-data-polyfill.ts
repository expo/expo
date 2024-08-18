/* formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

/* global FormData self Blob File */
/* eslint-disable no-inner-declarations */

if (typeof Blob !== 'undefined' && (typeof FormData === 'undefined' || !FormData.prototype.keys)) {
  const global =
    typeof globalThis === 'object'
      ? globalThis
      : typeof window === 'object'
        ? window
        : typeof self === 'object'
          ? self
          : this;

  // keep a reference to native implementation
  const _FormData = global.FormData;

  // To be monkey patched
  const _send = global.XMLHttpRequest && global.XMLHttpRequest.prototype.send;
  const _fetch = global.Request && global.fetch;
  const _sendBeacon = global.navigator && global.navigator.sendBeacon;
  // Might be a worker thread...
  const _match = global.Element && global.Element.prototype;

  // Unable to patch Request/Response constructor correctly #109
  // only way is to use ES6 class extend
  // https://github.com/babel/babel/issues/1966

  const stringTag = global.Symbol && Symbol.toStringTag;

  // Add missing stringTags to blob and files
  if (stringTag) {
    if (!Blob.prototype[stringTag]) {
      Blob.prototype[stringTag] = 'Blob';
    }

    if ('File' in global && !File.prototype[stringTag]) {
      File.prototype[stringTag] = 'File';
    }
  }

  function ensureArgs(args, expected) {
    if (args.length < expected) {
      throw new TypeError(`${expected} argument required, but only ${args.length} present.`);
    }
  }

  /**
   * @param {string} name
   * @param {string | undefined} filename
   * @returns {[string, File|string]}
   */
  function normalizeArgs(name, value, filename) {
    if (value instanceof Blob) {
      filename =
        filename !== undefined
          ? String(filename + '')
          : typeof value.name === 'string'
            ? value.name
            : 'blob';

      if (value.name !== filename || Object.prototype.toString.call(value) === '[object Blob]') {
        value = new File([value], filename);
      }
      return [String(name), value];
    }
    return [String(name), String(value)];
  }

  // normalize line feeds for textarea
  // https://html.spec.whatwg.org/multipage/form-elements.html#textarea-line-break-normalisation-transformation
  function normalizeLinefeeds(value) {
    return value.replace(/\r?\n|\r/g, '\r\n');
  }

  /**
   * @template T
   * @param {ArrayLike<T>} arr
   * @param {{ (elm: T): void; }} cb
   */
  function each(arr, cb) {
    for (let i = 0; i < arr.length; i++) {
      cb(arr[i]);
    }
  }

  const escape = (str) => str.replace(/\n/g, '%0A').replace(/\r/g, '%0D').replace(/"/g, '%22');

  FormData.prototype.keys =
    FormData.prototype.keys ||
    function keys() {
      const items = [];
      this.forEach((value, name) => {
        items.push(name);
      });

      return {
        [Symbol.iterator]: function* () {
          for (const name of items) {
            yield name;
          }
        },
      };
    };

  FormData.prototype.append =
    FormData.prototype.append ||
    function append(name, value) {
      ensureArgs(arguments, 2);
      const args = normalizeArgs(name, value);
      this._parts.push(args);
    };

  FormData.prototype.set =
    FormData.prototype.set ||
    function set(name, value) {
      ensureArgs(arguments, 2);
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
  FormData.prototype.forEach =
    FormData.prototype.forEach ||
    function forEach(callback, thisArg) {
      ensureArgs(arguments, 1);
      for (let i = 0; i < this._parts.length; i++) {
        callback.call(thisArg, this._parts[i][1], this._parts[i][0], this);
      }
    };

  FormData.prototype.delete =
    FormData.prototype.delete ||
    function (name) {
      ensureArgs(arguments, 1);
      name = String(name);
      for (let i = 0; i < this._parts.length; i++) {
        if (this._parts[i][0] === name) {
          this._parts.splice(i, 1);
          i--;
        }
      }
    };

  FormData.prototype.get =
    FormData.prototype.get ||
    function (name) {
      ensureArgs(arguments, 1);
      name = String(name);
      for (let i = 0; i < this._parts.length; i++) {
        if (this._parts[i][0] === name) {
          return this._parts[i][1];
        }
      }
      return null;
    };
  FormData.prototype.has =
    FormData.prototype.has ||
    function (name) {
      ensureArgs(arguments, 1);
      name = String(name);
      for (let i = 0; i < this._parts.length; i++) {
        if (this._parts[i][0] === name) {
          return true;
        }
      }
      return false;
    };

  FormData.prototype.entries =
    FormData.prototype.entries ||
    function* entries() {
      for (let i = 0; i < this._parts.length; i++) {
        yield this._parts[i];
      }
    };

  // Add symbol iterator if it does not exist
  FormData.prototype[Symbol.iterator] =
    FormData.prototype[Symbol.iterator] || FormData.prototype.entries;

  FormData.prototype.values =
    FormData.prototype.values ||
    function* values() {
      for (let i = 0; i < this._parts.length; i++) {
        yield this._parts[i][1];
      }
    };

  FormData.prototype.keys =
    FormData.prototype.keys ||
    function* keys() {
      for (let i = 0; i < this._parts.length; i++) {
        yield this._parts[i][0];
      }
    };

  FormData.prototype[Symbol.toStringTag] = 'FormData';
}
