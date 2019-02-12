export default {
  get name(): string {
    return 'ExpoCrypto';
  },
  async digestStringAsync(
    algorithm: string,
    data: string,
    options: { encoding: 'hex' }
  ): Promise<string> {
    return '';
  },
};
