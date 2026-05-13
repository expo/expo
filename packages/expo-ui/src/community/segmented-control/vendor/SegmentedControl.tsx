/**
 * Web/default implementation of SegmentedControl.
 * Vendored from @react-native-segmented-control/segmented-control (MIT license).
 * https://github.com/react-native-segmented-control/segmented-control
 */

import * as React from 'react';
import { Animated, Easing, I18nManager, StyleSheet, View, useColorScheme } from 'react-native';

import { SegmentedControlTab } from './SegmentedControlTab';
import { SegmentsSeparators } from './SegmentsSeparators';
import { buildChangeEvent, type SegmentedControlProps } from '../types';

export function SegmentedControl({
  style,
  onChange,
  onValueChange,
  enabled = true,
  selectedIndex,
  values,
  tintColor,
  appearance,
}: SegmentedControlProps) {
  const colorSchemeHook = useColorScheme();
  const colorScheme = appearance || colorSchemeHook;
  const [segmentWidth, setSegmentWidth] = React.useState(0);
  const animation = React.useRef(new Animated.Value(0)).current;

  const handleChange = (index: number) => {
    const val = values?.[index] ?? '';
    onValueChange?.(val);
    if (onChange) {
      onChange(buildChangeEvent(index, val));
    }
  };

  const updateSegmentWidth = React.useCallback(
    (width: number) => {
      const count = values?.length ?? 0;
      const newSegmentWidth = count ? width / count : 0;
      if (newSegmentWidth !== segmentWidth) {
        animation.setValue(newSegmentWidth * (selectedIndex ?? 0));
        setSegmentWidth(newSegmentWidth);
      }
    },
    [values?.length, segmentWidth, animation, selectedIndex]
  );

  React.useEffect(() => {
    if (animation && segmentWidth) {
      const isRTL = I18nManager.isRTL ? -segmentWidth : segmentWidth;
      Animated.timing(animation, {
        toValue: isRTL * (selectedIndex ?? 0),
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [animation, segmentWidth, selectedIndex]);

  return (
    <View
      style={[
        styles.default,
        style,
        colorScheme === 'dark' && styles.darkControl,
        !enabled && styles.disabled,
      ]}
      onLayout={({
        nativeEvent: {
          layout: { width },
        },
      }) => updateSegmentWidth(width)}>
      {!tintColor && (
        <SegmentsSeparators values={values?.length ?? 0} selectedIndex={selectedIndex} />
      )}
      {selectedIndex != null && segmentWidth ? (
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [{ translateX: animation }],
              width: segmentWidth - 4,
              zIndex: -1,
              backgroundColor: tintColor || (colorScheme === 'dark' ? '#636366' : 'white'),
            },
          ]}
        />
      ) : null}
      <View style={styles.segmentsContainer}>
        {values?.map((value, index) => (
          <SegmentedControlTab
            enabled={enabled}
            selected={selectedIndex === index}
            accessibilityHint={`${index + 1} out of ${values.length}`}
            key={index}
            value={value}
            tintColor={tintColor}
            appearance={colorScheme === 'dark' ? 'dark' : 'light'}
            onSelect={() => handleChange(index)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  default: {
    overflow: 'hidden',
    position: 'relative',
    height: 32,
    backgroundColor: '#EEEEF0',
    borderRadius: 9,
  },
  darkControl: {
    backgroundColor: '#1C1C1F',
  },
  disabled: {
    opacity: 0.4,
  },
  slider: {
    position: 'absolute',
    borderRadius: 7,
    top: 2,
    bottom: 2,
    right: 2,
    left: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  segmentsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    elevation: 5,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
});
