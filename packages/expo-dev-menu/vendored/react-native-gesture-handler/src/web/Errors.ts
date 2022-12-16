export class GesturePropError extends Error {
  constructor(name: string, value: unknown, expectedType: string) {
    super(
      `Invalid property \`${name}: ${value}\` expected \`${expectedType}\``
    );
  }
}
