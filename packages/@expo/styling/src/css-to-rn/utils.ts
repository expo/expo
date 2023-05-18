export function exhaustiveCheck(value: never) {
  throw new Error(`Unhandled case: ${value}`);
}
