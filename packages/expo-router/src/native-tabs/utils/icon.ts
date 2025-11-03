import { useEffect, useMemo, useState } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { BottomTabsScreenProps } from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { NativeTabOptions, NativeTabsProps } from '../types';

export function convertIconColorPropToObject(iconColor: NativeTabsProps['iconColor']): {
  default?: ColorValue;
  selected?: ColorValue;
} {
  if (iconColor) {
    if (typeof iconColor === 'object' && ('default' in iconColor || 'selected' in iconColor)) {
      return iconColor;
    }
    return {
      default: iconColor as ColorValue,
    };
  }
  return {};
}

type AwaitedIcon =
  | {
      sf?: SFSymbol;
      drawable?: string;
    }
  | {
      src?: ImageSourcePropType;
    };

export function useAwaitedScreensIcon(icon: NativeTabOptions['icon']) {
  const src = icon && typeof icon === 'object' && 'src' in icon ? icon.src : undefined;
  const [awaitedIcon, setAwaitedIcon] = useState<AwaitedIcon | undefined>(undefined);

  useEffect(() => {
    const loadIcon = async () => {
      if (src && src instanceof Promise) {
        const awaitedSrc = await src;
        if (awaitedSrc) {
          const currentAwaitedIcon = { src: awaitedSrc };
          setAwaitedIcon(currentAwaitedIcon);
        }
      }
    };
    loadIcon();
    // Checking `src` rather then icon here, to avoid unnecessary re-renders
    // The icon object can be recreated, while src should stay the same
    // In this case as we control `VectorIcon`, it will only change if `family` or `name` props change
    // So we should be safe with promise resolving
  }, [src]);

  return useMemo(() => (isAwaitedIcon(icon) ? icon : awaitedIcon), [awaitedIcon, icon]);
}

function isAwaitedIcon(icon: NativeTabOptions['icon']): icon is AwaitedIcon {
  return !icon || !('src' in icon && icon.src instanceof Promise);
}

export function convertOptionsIconToRNScreensPropsIcon(
  icon: AwaitedIcon | undefined
): BottomTabsScreenProps['icon'] {
  if (!icon) {
    return undefined;
  }
  if ('sf' in icon && icon.sf) {
    return { sfSymbolName: icon.sf };
  } else if ('src' in icon && icon.src) {
    return { templateSource: icon.src };
  }
  return undefined;
}

export function getRNScreensAndroidIconResourceFromAwaitedIcon(
  icon: AwaitedIcon | undefined
): BottomTabsScreenProps['iconResource'] {
  if (icon && 'src' in icon && icon.src) {
    return icon.src;
  }
  return undefined;
}

export function getRNScreensAndroidIconResourceNameFromAwaitedIcon(
  icon: AwaitedIcon | undefined
): BottomTabsScreenProps['iconResourceName'] {
  if (icon && 'drawable' in icon && icon.drawable) {
    return icon.drawable;
  }
  return undefined;
}
