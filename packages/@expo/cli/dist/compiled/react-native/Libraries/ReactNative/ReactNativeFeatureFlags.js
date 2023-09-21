var ReactNativeFeatureFlags = {
  isLayoutAnimationEnabled: function isLayoutAnimationEnabled() {
    return true;
  },
  shouldEmitW3CPointerEvents: function shouldEmitW3CPointerEvents() {
    return false;
  },
  shouldPressibilityUseW3CPointerEventsForHover: function shouldPressibilityUseW3CPointerEventsForHover() {
    return false;
  },
  animatedShouldDebounceQueueFlush: function animatedShouldDebounceQueueFlush() {
    return false;
  },
  animatedShouldUseSingleOp: function animatedShouldUseSingleOp() {
    return false;
  },
  isGlobalWebPerformanceLoggerEnabled: function isGlobalWebPerformanceLoggerEnabled() {
    return false;
  },
  enableAccessToHostTreeInFabric: function enableAccessToHostTreeInFabric() {
    return false;
  }
};
module.exports = ReactNativeFeatureFlags;