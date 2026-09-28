import { loadAsync, type FontSource } from 'expo-font';
import { useState, useEffect, useMemo, type JSX } from 'react';
import { Platform, PlatformColor, Text, View } from 'react-native';

import type { SymbolViewProps } from './SymbolModule.types';
import { androidSymbolToString } from './android';
import { getFont } from './utils';

// trying to mirror iOS implementation
const DEFAULT_SYMBOL_COLOR =
  Platform.OS === 'android' ? PlatformColor('@android:color/system_primary_dark') : '#7d9bd4';

export function SymbolView(props: SymbolViewProps): JSX.Element {
  const font = useMemo(() => getFont(props.weight), [props.weight]);
  const name =
    typeof props.name === 'object'
      ? props.name[Platform.OS === 'android' ? 'android' : 'web']
      : null;
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
    return <>{props.fallback}</>;
  }
  const size = props.size ?? 24;
  const style = [{ width: size, height: size }, props.style];
  if (!loadedFontName) {
    return <View style={style} />;
  }
  return (
    <View style={style}>
      <Text
        style={{
          fontFamily: loadedFontName,
          color: props.tintColor ?? DEFAULT_SYMBOL_COLOR,
          fontSize: size,
          lineHeight: size,
        }}>
        {androidSymbolToString(name)}
      </Text>
    </View>
  );
}
