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
  weight,
  size: sizeProp,
  tintColor,
  style: styleProp,
  ...viewProps
}: SymbolViewProps): JSX.Element {
  const font = useMemo(() => getFont(weight), [weight]);
  const name =
    typeof nameProp === 'object' ? nameProp[Platform.OS === 'android' ? 'android' : 'web'] : null;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    loadAsync({
      [font.name]: {
        uri: font.font,
      } as FontSource,
    })
      .then(() => setLoaded(true))
      .catch(() => {
        /* noop */
      });
  }, []);
  if (!name) {
    return <>{fallback}</>;
  }
  const size = sizeProp ?? 24;
  const style = [{ width: size, height: size }, styleProp];
  if (!loaded) {
    return <View collapsable={false} {...viewProps} style={style} />;
  }
  return (
    <View collapsable={false} {...viewProps} style={style}>
      <Text
        aria-hidden
        style={{
          fontFamily: font.name,
          color: tintColor ?? DEFAULT_SYMBOL_COLOR,
          fontSize: size,
          lineHeight: size,
        }}>
        {androidSymbolToString(name)}
      </Text>
    </View>
  );
}
