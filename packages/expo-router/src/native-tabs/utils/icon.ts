import { useEffect, useMemo, useState } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import type {
  BottomTabsScreenProps,
  PlatformIconAndroid,
  PlatformIconIOS,
} from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';

import { isChildOfType } from '../../utils/children';
import { NativeTabsTriggerPromiseIcon, NativeTabsTriggerVectorIcon } from '../common/elements';
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
  return {
    ios: convertOptionsIconToIOSPropsIcon(icon),
    android: convertOptionsIconToAndroidPropsIcon(icon),
  };
}

export function convertOptionsIconToIOSPropsIcon(
  icon: AwaitedIcon | undefined
): PlatformIconIOS | undefined {
  if (!icon) {
    return undefined;
  }
  if ('sf' in icon && icon.sf) {
    return { ios: { type: 'sfSymbol', name: icon.sf }, type: 'sfSymbol', name: icon.sf };
  } else if ('src' in icon && icon.src) {
    return {
      ios: { type: 'templateSource', templateSource: icon.src },
      android: { type: 'imageSource', imageSource: icon.src },
      type: 'templateSource',
      templateSource: icon.src,
    };
  }
  return undefined;
}

export function convertOptionsIconToAndroidPropsIcon(
  icon: AwaitedIcon
): PlatformIconAndroid | undefined {
  if (icon && 'drawable' in icon && icon.drawable) {
    return {
      type: 'drawableResource',
      name: icon.drawable,
    };
  }
  if (icon && 'src' in icon && icon.src) {
    return { type: 'imageSource', imageSource: icon.src };
  }
  return undefined;
}

export function convertComponentSrcToImageSource(src: React.ReactElement) {
  if (isChildOfType(src, NativeTabsTriggerVectorIcon)) {
    const props = src.props;
    return { src: props.family.getImageSource(props.name, 24, 'white') };
  } else if (isChildOfType(src, NativeTabsTriggerPromiseIcon)) {
    return { src: src.props.loader() };
  } else {
    console.warn('Only VectorIcon is supported as a React element in Icon.src');
  }
  return undefined;
}
