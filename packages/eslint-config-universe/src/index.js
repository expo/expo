module.exports = {
  configs: {
    get default() {
      return require('./presets/default');
    },
    get native() {
      return require('./presets/native');
    },
    get node() {
      return require('./presets/node');
    },
    get web() {
      return require('./presets/web');
    },
  },
};
