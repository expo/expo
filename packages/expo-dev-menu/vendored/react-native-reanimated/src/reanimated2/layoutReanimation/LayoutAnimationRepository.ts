/* global _stopObservingProgress, _startObservingProgress */
import { runOnUI } from '../core';
import { withStyleAnimation } from '../animation/styleAnimation';
import { ColorProperties } from '../UpdateProps';
import { processColor } from '../Colors';

runOnUI(() => {
  'worklet';

  const configs: Record<string, any> = Object.create(null);
  const enteringAnimationForTag: Record<string, any> = {};

  global.LayoutAnimationRepository = {
    configs,
    registerConfig(tag, config) {
      configs[tag] = config;
      enteringAnimationForTag[tag] = null;
    },
    removeConfig(tag) {
      delete configs[tag];
      delete enteringAnimationForTag[tag];
    },
    startAnimationForTag(tag, type, yogaValues) {
      if (configs[tag] == null) {
        return; // :(
      }
      const style = configs[tag][type](yogaValues);
      let currentAnimation = style.animations;
      if (type === 'entering') {
        enteringAnimationForTag[tag] = style;
      } else if (type === 'layout' && enteringAnimationForTag[tag] !== null) {
        const entryAniamtion = enteringAnimationForTag[tag].animations;
        const layoutAnimation = style.animations;
        currentAnimation = {};
        for (const key in entryAniamtion) {
          currentAnimation[key] = entryAniamtion[key];
        }
        for (const key in layoutAnimation) {
          currentAnimation[key] = layoutAnimation[key];
        }
      }

      const sv: { value: boolean; _value: boolean } = configs[tag].sv;
      _stopObservingProgress(tag, false);
      _startObservingProgress(tag, sv);

      const backupColor: Record<string, string> = {};
      for (const key in style.initialValues) {
        if (ColorProperties.includes(key)) {
          const value = style.initialValues[key];
          backupColor[key] = value;
          style.initialValues[key] = processColor(value);
        }
      }

      sv.value = Object.assign({}, sv._value, style.initialValues);
      _stopObservingProgress(tag, false);
      const animation = withStyleAnimation(currentAnimation);

      animation.callback = (finished?: boolean) => {
        if (finished) {
          _stopObservingProgress(tag, finished);
        }
        style.callback && style.callback(finished);
      };

      if (backupColor) {
        configs[tag].sv._value = { ...configs[tag].sv.value, ...backupColor };
      }

      configs[tag].sv.value = animation;
      _startObservingProgress(tag, sv);
    },
  };
})();
