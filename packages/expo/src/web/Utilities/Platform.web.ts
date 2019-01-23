export default {
  get OS(): string {
    return 'web';
  },
  select(platforms: { [os: string]: any }): any | undefined {
    if (this.OS in platforms) {
      return platforms[this.OS];
    }
    return platforms.default;
  },
};
