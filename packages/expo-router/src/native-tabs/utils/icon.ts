import { useEffect, useMemo, useState } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { isChildOfType } from '../../utils/children';
import { NativeTabsTriggerPromiseIcon, NativeTabsTriggerVectorIcon } from '../common/elements';
import type {
  IconRenderingMode,
  IconTinting,
  NativeTabOptions,
  NativeTabsProps,
  SymbolOrImageSource,
} from '../types';

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

export type AwaitedIcon =
  | {
      sf?: SFSymbol;
      xcasset?: string;
      drawable?: string;
      renderingMode?: IconRenderingMode;
      tinting?: IconTinting;
    }
  | {
      src?: ImageSourcePropType;
      renderingMode?: IconRenderingMode;
      tinting?: IconTinting;
    };

export function useAwaitedScreensIcon(icon: NativeTabOptions['icon']) {
  const src = icon && typeof icon === 'object' && 'src' in icon ? icon.src : undefined;
  const [awaitedSrc, setAwaitedSrc] = useState<ImageSourcePropType | undefined>(undefined);

  useEffect(() => {
    const loadIcon = async () => {
      if (src && src instanceof Promise) {
        const resolvedSrc = await src;
        if (resolvedSrc) {
          setAwaitedSrc(resolvedSrc);
        }
      }
    };
    loadIcon();
    // Checking `src` rather than icon here, to avoid unnecessary re-renders
    // The icon object can be recreated, while src should stay the same
    // In this case as we control `VectorIcon`, it will only change if `family` or `name` props change
    // So we should be safe with promise resolving
  }, [src]);

  return useMemo((): AwaitedIcon | undefined => {
    if (isAwaitedIcon(icon)) {
      return icon;
    }
    // Keep the icon's rendering mode and tinting, and swap in the loaded source.
    return awaitedSrc ? { ...icon, src: awaitedSrc } : undefined;
  }, [awaitedSrc, icon]);
}

function isAwaitedIcon(icon: NativeTabOptions['icon']): icon is AwaitedIcon {
  return !icon || !('src' in icon && icon.src instanceof Promise);
}

export function convertComponentSrcToImageSource(src: React.ReactElement) {
  let result: SymbolOrImageSource | undefined;
  if (isChildOfType(src, NativeTabsTriggerVectorIcon)) {
    const props = src.props;
    result = { src: props.family.getImageSource(props.name, 24, 'white') };
  } else if (isChildOfType(src, NativeTabsTriggerPromiseIcon)) {
    result = { src: src.props.loader() };
  } else {
    console.warn('Only VectorIcon is supported as a React element in Icon.src');
    return undefined;
  }
  return result;
}
