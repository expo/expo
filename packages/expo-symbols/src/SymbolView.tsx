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
  const {
    name: _name,
    fallback: _fallback,
    type: _type,
    scale: _scale,
    weight: _weight,
    colors: _colors,
    size: _size,
    tintColor: _tintColor,
    resizeMode: _resizeMode,
    animationSpec: _animationSpec,
    style: _style,
    ...viewProps
  } = props;
  const font = useMemo(() => getFont(props.weight), [props.weight]);
  const name =
    typeof props.name === 'object'
      ? props.name[Platform.OS === 'android' ? 'android' : 'web']
      : null;
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
    return <>{props.fallback}</>;
  }
  const size = props.size ?? 24;
  const style = [{ width: size, height: size }, props.style];
  // Forward view props such as `aria-hidden` and `accessibilityLabel` to the view we render.
  if (!loaded) {
    return <View {...viewProps} style={style} />;
  }
  return (
    <View {...viewProps} style={style}>
      <Text
        style={{
          fontFamily: font.name,
          color: props.tintColor ?? DEFAULT_SYMBOL_COLOR,
          fontSize: size,
          lineHeight: size,
        }}>
        {androidSymbolToString(name)}
      </Text>
    </View>
  );
}
