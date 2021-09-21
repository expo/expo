// Metro and terser don't seem to be capable of shaking the imports unless they're wrapped in __DEV__.
if (__DEV__) {
    require('./installDevLogging').installDevLogging();
}
//# sourceMappingURL=logging.fx.js.map