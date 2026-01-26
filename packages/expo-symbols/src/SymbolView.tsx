import { useFonts } from '@expo-google-fonts/material-symbols';
import { useMemo } from 'react';
import { Platform, PlatformColor, Text, View } from 'react-native';

import { SymbolViewProps } from './SymbolModule.types';
import { androidSymbolToString } from './android';
import { getFont } from './utils';

// trying to mirror iOS implementation
const DEFAULT_SYMBOL_COLOR =
  Platform.OS === 'android' ? PlatformColor('@android:color/system_primary_dark') : '#7d9bd4';

export function SymbolView(props: SymbolViewProps) {
  const font = useMemo(() => getFont(props.weight), [props.weight]);
  const name =
    typeof props.name === 'object'
      ? props.name[Platform.OS === 'android' ? 'android' : 'web']
      : null;
  const [loaded] = useFonts({
    [font.name]: {
      uri: font.font,
      testString: name ? androidSymbolToString(name) : null,
    },
  });
  if (!name) {
    return <>{props.fallback}</>;
  }
  if (!loaded) {
    return <View style={{ width: props.size ?? 24, height: props.size ?? 24 }} />;
  }
  return (
    <View style={{ width: props.size ?? 24, height: props.size ?? 24 }}>
      <Text
        style={{
          fontFamily: font.name,
          color: props.tintColor ?? DEFAULT_SYMBOL_COLOR,
          fontSize: props.size ?? 24,
          lineHeight: props.size ?? 24,
        }}>
        {androidSymbolToString(name)}
      </Text>
    </View>
  );
}
