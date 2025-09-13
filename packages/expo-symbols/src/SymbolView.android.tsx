import { useFonts } from '@expo-google-fonts/material-symbols';
import { useMemo } from 'react';
import { PlatformColor, Text } from 'react-native';

import { SymbolViewProps } from './SymbolModule.types';
import { androidSymbolToString } from './android';
import regular from './android/weights/regular';

// trying to mirror iOS implementation
const DEFAULT_SYMBOL_COLOR = PlatformColor('@android:color/system_primary_dark');

function getFont(weight: SymbolViewProps['weight']) {
  const platformWeight = typeof weight === 'object' ? weight.android : null;
  if (!platformWeight) return regular;

  return platformWeight;
}

function AndroidSymbolView(props: SymbolViewProps) {
  const font = useMemo(() => getFont(props.weight), [props.weight]);
  useFonts({ [font.name]: font.font });

  return (
    <Text
      style={{
        fontFamily: font.name,
        color: props.tintColor ?? DEFAULT_SYMBOL_COLOR,
        fontSize: props.size ?? 24,
      }}>
      {androidSymbolToString(typeof props.name === 'object' ? props.name.android : null)}
    </Text>
  );
}

export function SymbolView(props: SymbolViewProps) {
  return <AndroidSymbolView {...props} />;
}
