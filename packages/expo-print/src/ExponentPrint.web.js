// @flow

export default {
  get name() {
    return 'ExponentPrint';
  },
  get Orientation() {
    return {
      portrait: 'portrait',
      landscape: 'landscape',
    };
  },
  async print(options) {
    return window.print();
  },
  async printToFileAsync(options) {
    return this.print(options);
  },
};
