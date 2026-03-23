import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type HoverEffectProps = {
  color?: string;
  hoverOpacity?: number;
  activeOpacity?: number;
};

export type Props = Omit<PressableProps, 'style' | 'onPress'> & {
  href?: string;
  pressColor?: string;
  pressOpacity?: number;
  hoverEffect?: HoverEffectProps;
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  onPress?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
  ) => void;
  children: React.ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ANDROID_VERSION_LOLLIPOP = 21;
const ANDROID_SUPPORTS_RIPPLE =
  Platform.OS === 'android' && Platform.Version >= ANDROID_VERSION_LOLLIPOP;

const useNativeDriver = Platform.OS !== 'web';

/**
 * PlatformPressable provides an abstraction on top of Pressable to handle platform differences.
 */
function PlatformPressableInternal(
  {
    disabled,
    onPress,
    onPressIn,
    onPressOut,
    android_ripple,
    pressColor,
    pressOpacity = 0.3,
    hoverEffect,
    style,
    children,
    ...rest
  }: Props,
  ref: React.Ref<React.ComponentRef<typeof AnimatedPressable>>
) {
  const { dark } = useTheme();
  const [opacity] = React.useState(() => new Animated.Value(1));

  const animateTo = (toValue: number, duration: number) => {
    if (ANDROID_SUPPORTS_RIPPLE) {
      return;
    }

    Animated.timing(opacity, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver,
    }).start();
  };

  const handlePress = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
  ) => {
    if (Platform.OS === 'web' && rest.href !== null) {
      // ignore clicks with modifier keys
      const hasModifierKey =
        ('metaKey' in e && e.metaKey) ||
        ('altKey' in e && e.altKey) ||
        ('ctrlKey' in e && e.ctrlKey) ||
        ('shiftKey' in e && e.shiftKey);

      // only handle left clicks
      const isLeftClick =
        'button' in e ? e.button == null || e.button === 0 : true;

      // let browser handle "target=_blank" etc.
      const isSelfTarget =
        e.currentTarget && 'target' in e.currentTarget
          ? [undefined, null, '', 'self'].includes(e.currentTarget.target)
          : true;

      if (!hasModifierKey && isLeftClick && isSelfTarget) {
        e.preventDefault();
        // call `onPress` only when browser default is prevented
        // this prevents app from handling the click when a link is being opened
        onPress?.(e);
      }
    } else {
      onPress?.(e);
    }
  };

  const handlePressIn = (e: GestureResponderEvent) => {
    animateTo(pressOpacity, 0);
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    animateTo(1, 200);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      ref={ref}
      accessible
      role={Platform.OS === 'web' && rest.href != null ? 'link' : 'button'}
      onPress={disabled ? undefined : handlePress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      android_ripple={
        ANDROID_SUPPORTS_RIPPLE && !disabled
          ? {
              color:
                pressColor !== undefined
                  ? pressColor
                  : dark
                    ? 'rgba(255, 255, 255, .32)'
                    : 'rgba(0, 0, 0, .32)',
              ...android_ripple,
            }
          : undefined
      }
      style={[
        {
          cursor:
            (Platform.OS === 'web' || Platform.OS === 'ios') && !disabled
              ? // Pointer cursor on web
                // Hover effect on iPad and visionOS
                'pointer'
              : 'auto',
          opacity: !ANDROID_SUPPORTS_RIPPLE && !disabled ? opacity : 1,
        },
        style,
      ]}
      {...rest}
    >
      {!disabled ? <HoverEffect {...hoverEffect} /> : null}
      {children}
    </AnimatedPressable>
  );
}

export const PlatformPressable = React.forwardRef(PlatformPressableInternal);

PlatformPressable.displayName = 'PlatformPressable';

const css = String.raw;

const CLASS_NAME = `__react-navigation_elements_Pressable_hover`;

const CSS_TEXT = css`
  .${CLASS_NAME} {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    background-color: var(--overlay-color);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  a:hover > .${CLASS_NAME}, button:hover > .${CLASS_NAME} {
    opacity: var(--overlay-hover-opacity);
  }

  a:active > .${CLASS_NAME}, button:active > .${CLASS_NAME} {
    opacity: var(--overlay-active-opacity);
  }
`;

const HoverEffect = ({
  color,
  hoverOpacity = 0.08,
  activeOpacity = 0.16,
}: HoverEffectProps) => {
  if (Platform.OS !== 'web' || color == null) {
    return null;
  }

  return (
    <>
      <style href={CLASS_NAME} precedence="elements">
        {CSS_TEXT}
      </style>
      <div
        className={CLASS_NAME}
        style={{
          // @ts-expect-error: CSS variables are not typed
          '--overlay-color': color,
          '--overlay-hover-opacity': hoverOpacity,
          '--overlay-active-opacity': activeOpacity,
        }}
      />
    </>
  );
};
