export default {
  async canAddPassesAsync(): Promise<boolean> {
    return new Promise(resolve => {
      resolve(true);
    });
  },
  async addPassFromUrlAsync(url: string): Promise<boolean> {
    window.open(url);
    return new Promise(resolve => {
      resolve(true);
    });
  },
};
