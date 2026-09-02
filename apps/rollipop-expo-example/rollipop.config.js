// Enable rollipop's native (rust) transform pipeline.
// The legacy JS codegen path cannot parse RN-core's mixed Flow/TS
// `*NativeComponent.js` modules (e.g. DebuggingOverlay, VirtualView) under
// babel 8's `flow` parser — they require Hermes, which is incompatible with
// babel 8. The native pipeline handles Flow-strip + codegen natively, which is
// the path upstream's green e2e actually exercises.
module.exports = {
  experimental: {
    nativeTransformPipeline: true,
  },
};
