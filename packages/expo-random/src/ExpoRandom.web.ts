export default {
  get name(): string {
    return 'ExpoRandom';
  },
  async getRandomIntegerAsync(length: number): Promise<Uint8Array> {
    const array = new Uint8Array(length);
    return window.crypto.getRandomValues(array);
  },
};
