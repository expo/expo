/* global _stopObservingProgress, _startObservingProgress */
import { runOnUI } from '../core';
import { withStyleAnimation } from '../animation/styleAnimation';

runOnUI(() => {
  'worklet';

  const configs: Record<string, any> = {};

  global.LayoutAnimationRepository = {
    configs,
    registerConfig(tag, config) {
      configs[tag] = config;
    },
    removeConfig(tag) {
      delete configs[tag];
    },
    startAnimationForTag(tag, type, yogaValues) {
      if (configs[tag] == null) {
        return; // :(
      }

      const style = configs[tag][type](yogaValues);
      const sv: { value: boolean; _value: boolean } = configs[tag].sv;
      _stopObservingProgress(tag, false);
      _startObservingProgress(tag, sv);
      sv._value = Object.assign({}, sv._value, style.initialValues);
      _stopObservingProgress(tag, false);
      const animation = withStyleAnimation(style.animations);

      animation.callback = (finished?: boolean) => {
        if (finished) {
          _stopObservingProgress(tag, finished);
        }
        style.callback && style.callback(finished);
      };
      configs[tag].sv.value = animation;
      _startObservingProgress(tag, sv);
    },
  };
})();
