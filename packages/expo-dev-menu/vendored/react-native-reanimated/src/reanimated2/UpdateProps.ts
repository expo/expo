/* global _updateProps */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { processColor } from './Colors';
import { makeShareable, isConfigured } from './core';
import { _updatePropsJS } from './js-reanimated';
import { shouldBeUseWeb } from './PlatformChecker';

// copied from react-native/Libraries/Components/View/ReactNativeStyleAttributes
export const colorProps = [
  'backgroundColor',
  'borderBottomColor',
  'borderColor',
  'borderLeftColor',
  'borderRightColor',
  'borderTopColor',
  'borderStartColor',
  'borderEndColor',
  'color',
  'shadowColor',
  'textDecorationColor',
  'tintColor',
  'textShadowColor',
  'overlayColor',
];

const ColorProperties = !isConfigured() ? [] : makeShareable(colorProps);

let updatePropsByPlatform;
if (shouldBeUseWeb()) {
  updatePropsByPlatform = (_, updates, maybeViewRef) => {
    'worklet';
    maybeViewRef.items.forEach((item, _) => {
      _updatePropsJS(updates, item);
    });
  };
} else {
  updatePropsByPlatform = (viewDescriptors, updates, _) => {
    'worklet';

    for (const key in updates) {
      if (ColorProperties.indexOf(key) !== -1) {
        updates[key] = processColor(updates[key]);
      }
    }

    viewDescriptors.value.forEach((viewDescriptor) => {
      _updateProps(
        viewDescriptor.tag,
        viewDescriptor.name || 'RCTView',
        updates
      );
    });
  };
}

export const updateProps = updatePropsByPlatform;

export const updatePropsJestWrapper = (
  viewDescriptors,
  updates,
  maybeViewRef,
  animatedStyle,
  adapters
) => {
  adapters.forEach((adapter) => {
    adapter(updates);
  });
  animatedStyle.current.value = {
    ...animatedStyle.current.value,
    ...updates,
  };

  updateProps(viewDescriptors, updates, maybeViewRef);
};

export default updateProps;
