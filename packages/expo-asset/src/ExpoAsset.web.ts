export default {
  async downloadAsync(url: string, _hash: string | null, _type: string): Promise<string> {
    return url;
  },
};
