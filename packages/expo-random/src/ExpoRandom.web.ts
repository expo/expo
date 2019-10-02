export default {
  get name(): string {
    return 'ExpoRandom';
  },
  async getRandomBytesAsync(length: number): Promise<Uint8Array> {
    const array = new Uint8Array(length);
    return window.crypto.getRandomValues(array);
  },
};
