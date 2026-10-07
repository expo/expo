import { loadAsync, type FontSource } from 'expo-font';
import { useState, useEffect, useMemo, type JSX } from 'react';
import { Platform, PlatformColor, Text, View } from 'react-native';

import type { SymbolViewProps } from './SymbolModule.types';
import { androidSymbolToString } from './android';
import { getFont } from './utils';

// trying to mirror iOS implementation
const DEFAULT_SYMBOL_COLOR =
  Platform.OS === 'android' ? PlatformColor('@android:color/system_primary_dark') : '#7d9bd4';

export function SymbolView({
  name: nameProp,
  fallback,
  type,
  scale,
  weight,
  colors,
  size: sizeProp,
  tintColor,
  resizeMode,
  animationSpec,
  style: styleProp,
  ...viewProps
}: SymbolViewProps): JSX.Element {
  const font = useMemo(() => getFont(weight), [weight]);
  const name =
    typeof nameProp === 'object' ? nameProp[Platform.OS === 'android' ? 'android' : 'web'] : null;
  // Until the font of a new weight loads, the symbol keeps the previous weight's font instead of
  // disappearing.
  const [loadedFontName, setLoadedFontName] = useState<string | null>(null);
  useEffect(() => {
    let isCurrentFont = true;
    loadAsync({
      [font.name]: {
        uri: font.font,
      } as FontSource,
    })
      .then(() => {
        if (isCurrentFont) {
          setLoadedFontName(font.name);
        }
      })
      .catch(() => {
        /* noop */
      });
    return () => {
      isCurrentFont = false;
    };
  }, [font.name, font.font]);
  if (!name) {
    return <>{fallback}</>;
  }
  const size = sizeProp ?? 24;
  const style = [{ width: size, height: size }, styleProp];
  if (!loadedFontName) {
    return <View collapsable={false} {...viewProps} style={style} />;
  }
  return (
    <View collapsable={false} {...viewProps} style={style}>
      <Text
        aria-hidden
        style={{
          fontFamily: loadedFontName,
          color: tintColor ?? DEFAULT_SYMBOL_COLOR,
          fontSize: size,
          lineHeight: size,
        }}>
        {androidSymbolToString(name)}
      </Text>
    </View>
  );
}
