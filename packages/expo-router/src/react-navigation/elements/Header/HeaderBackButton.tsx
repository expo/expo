import { useLocale, useTheme } from '@react-navigation/native';
import * as React from 'react';
import {
  Animated,
  Image,
  Platform,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
} from 'react-native';

import backIcon from '../assets/back-icon.png';
import backIconMask from '../assets/back-icon-mask.png';
import { MaskedView } from '../MaskedView';
import type { HeaderBackButtonProps } from '../types';
import { HeaderButton } from './HeaderButton';
import { HeaderIcon, ICON_MARGIN } from './HeaderIcon';

export function HeaderBackButton({
  disabled,
  allowFontScaling,
  backImage,
  label,
  labelStyle,
  displayMode = Platform.OS === 'ios' ? 'default' : 'minimal',
  onLabelLayout,
  onPress,
  pressColor,
  pressOpacity,
  screenLayout,
  tintColor,
  titleLayout,
  truncatedLabel = 'Back',
  accessibilityLabel = label && label !== 'Back' ? `${label}, back` : 'Go back',
  testID,
  style,
  href,
}: HeaderBackButtonProps) {
  const { colors, fonts } = useTheme();
  const { direction } = useLocale();

  const [labelWidth, setLabelWidth] = React.useState<number | null>(null);
  const [truncatedLabelWidth, setTruncatedLabelWidth] = React.useState<
    number | null
  >(null);

  const renderBackImage = () => {
    if (backImage) {
      return backImage({ tintColor: tintColor ?? colors.text });
    } else {
      return (
        <HeaderIcon
          source={backIcon}
          tintColor={tintColor}
          style={[
            styles.icon,
            displayMode !== 'minimal' && styles.iconWithLabel,
          ]}
        />
      );
    }
  };

  const renderLabel = () => {
    if (displayMode === 'minimal') {
      return null;
    }

    const availableSpace =
      titleLayout && screenLayout
        ? (screenLayout.width - titleLayout.width) / 2 -
          (ICON_WIDTH + ICON_MARGIN)
        : null;

    const potentialLabelText =
      displayMode === 'default' ? label : truncatedLabel;
    const finalLabelText =
      availableSpace && labelWidth && truncatedLabelWidth
        ? availableSpace > labelWidth
          ? potentialLabelText
          : availableSpace > truncatedLabelWidth
            ? truncatedLabel
            : null
        : potentialLabelText;

    const commonStyle: Animated.WithAnimatedValue<StyleProp<TextStyle>> = [
      fonts.regular,
      styles.label,
      labelStyle,
    ];

    const hiddenStyle: Animated.WithAnimatedValue<StyleProp<TextStyle>> = [
      commonStyle,
      {
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0,
      },
    ];

    const labelElement = (
      <View style={styles.labelWrapper}>
        {label && displayMode === 'default' ? (
          <Animated.Text
            style={hiddenStyle}
            numberOfLines={1}
            onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}
          >
            {label}
          </Animated.Text>
        ) : null}
        {truncatedLabel ? (
          <Animated.Text
            style={hiddenStyle}
            numberOfLines={1}
            onLayout={(e) => setTruncatedLabelWidth(e.nativeEvent.layout.width)}
          >
            {truncatedLabel}
          </Animated.Text>
        ) : null}
        {finalLabelText ? (
          <Animated.Text
            accessible={false}
            onLayout={onLabelLayout}
            style={[tintColor ? { color: tintColor } : null, commonStyle]}
            numberOfLines={1}
            allowFontScaling={!!allowFontScaling}
          >
            {finalLabelText}
          </Animated.Text>
        ) : null}
      </View>
    );

    if (backImage || Platform.OS !== 'ios') {
      // When a custom backimage is specified, we can't mask the label
      // Otherwise there might be weird effect due to our mask not being the same as the image
      return labelElement;
    }

    return (
      <MaskedView
        maskElement={
          <View
            style={[
              styles.iconMaskContainer,
              // Extend the mask to the center of the screen so that label isn't clipped during animation
              screenLayout ? { minWidth: screenLayout.width / 2 - 27 } : null,
            ]}
          >
            <Image
              source={backIconMask}
              resizeMode="contain"
              style={[styles.iconMask, direction === 'rtl' && styles.flip]}
            />
            <View style={styles.iconMaskFillerRect} />
          </View>
        }
      >
        {labelElement}
      </MaskedView>
    );
  };

  const handlePress = () => {
    if (onPress) {
      requestAnimationFrame(() => onPress());
    }
  };

  return (
    <HeaderButton
      disabled={disabled}
      href={href}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={handlePress}
      pressColor={pressColor}
      pressOpacity={pressOpacity}
      style={[styles.container, style]}
    >
      <React.Fragment>
        {renderBackImage()}
        {renderLabel()}
      </React.Fragment>
    </HeaderButton>
  );
}

const ICON_WIDTH = Platform.OS === 'ios' ? 13 : 24;
const ICON_MARGIN_END = Platform.OS === 'ios' ? 22 : 3;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    minWidth: StyleSheet.hairlineWidth, // Avoid collapsing when title is long
    ...Platform.select({
      ios: null,
      default: {
        marginVertical: 3,
        marginHorizontal: 11,
      },
    }),
  },
  label: {
    fontSize: 17,
    // Title and back label are a bit different width due to title being bold
    // Adjusting the letterSpacing makes them coincide better
    letterSpacing: 0.35,
  },
  labelWrapper: {
    // These styles will make sure that the label doesn't fill the available space
    // Otherwise it messes with the measurement of the label
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginEnd: ICON_MARGIN,
  },
  icon: {
    width: ICON_WIDTH,
    marginEnd: ICON_MARGIN_END,
  },
  iconWithLabel:
    Platform.OS === 'ios'
      ? {
          marginEnd: 6,
        }
      : {},
  iconMaskContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconMaskFillerRect: {
    flex: 1,
    backgroundColor: '#000',
  },
  iconMask: {
    height: 21,
    width: 13,
    marginStart: -14.5,
    marginVertical: 12,
    alignSelf: 'center',
  },
  flip: {
    transform: 'scaleX(-1)',
  },
});
