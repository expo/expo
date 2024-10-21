import type { ErrorLike } from "./types";

export function checkValidArgs(keyValuePairs: unknown[], callback: unknown) {
  if (
    !Array.isArray(keyValuePairs) ||
    keyValuePairs.length === 0 ||
    !Array.isArray(keyValuePairs[0])
  ) {
    throw new Error(
      "[AsyncStorage] Expected array of key-value pairs as first argument to multiSet"
    );
  }

  if (callback && typeof callback !== "function") {
    if (Array.isArray(callback)) {
      throw new Error(
        "[AsyncStorage] Expected function as second argument to multiSet. Did you forget to wrap key-value pairs in an array for the first argument?"
      );
    }

    throw new Error(
      "[AsyncStorage] Expected function as second argument to multiSet"
    );
  }
}

export function checkValidInput(...input: unknown[]) {
  const [key, value] = input;

  if (typeof key !== "string") {
    // eslint-disable-next-line no-console
    console.warn(
      `[AsyncStorage] Using ${typeof key} type for key is not supported. This can lead to unexpected behavior/errors. Use string instead.\nKey passed: ${key}\n`
    );
  }

  if (input.length > 1 && typeof value !== "string") {
    if (value == null) {
      throw new Error(
        `[AsyncStorage] Passing null/undefined as value is not supported. If you want to remove value, Use .removeItem method instead.\nPassed value: ${value}\nPassed key: ${key}\n`
      );
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `[AsyncStorage] The value for key "${key}" is not a string. This can lead to unexpected behavior/errors. Consider stringifying it.\nPassed value: ${value}\nPassed key: ${key}\n`
      );
    }
  }
}

export function convertError(error?: ErrorLike): Error | null {
  if (!error) {
    return null;
  }

  const out = new Error(error.message) as Error & ErrorLike;
  out["key"] = error.key;
  return out;
}

export function convertErrors(
  errs?: ErrorLike[]
): ReadonlyArray<Error | null> | null {
  const errors = ensureArray(errs);
  return errors ? errors.map((e) => convertError(e)) : null;
}

function ensureArray(e?: ErrorLike | ErrorLike[]): ErrorLike[] | null {
  if (Array.isArray(e)) {
    return e.length === 0 ? null : e;
  } else if (e) {
    return [e];
  } else {
    return null;
  }
}
