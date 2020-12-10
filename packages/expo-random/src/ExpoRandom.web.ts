export default {
  get name(): string {
    return 'ExpoRandom';
  },
  getRandomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    // @ts-ignore
    return (window.crypto ?? window.msCrypto).getRandomValues(array);
  },
  async getRandomBytesAsync(length: number): Promise<Uint8Array> {
    const array = new Uint8Array(length);
    // @ts-ignore
    return (window.crypto ?? window.msCrypto).getRandomValues(array);
  },
};
