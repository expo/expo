export default {
  async canAddPassesAsync(): Promise<boolean> {
    return true;
  },
  async addPassFromUrlAsync(url: string): Promise<boolean> {
    window.open(url);
    return true;
  },
};
