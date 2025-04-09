import { View } from 'react-native';
import { ErrorOverlayHeader } from '@expo/metro-runtime/src/error-overlay/overlay/ErrorOverlayHeader';

export default function App() {
  const onDismiss = () => {};
  const onMinimize = () => {};
  const onChangeSelectedIndex = () => {};

  return (
    <View style={{ flex: 1, gap: 16, backgroundColor: 'black' }}>
      <View style={{ borderWidth: 1, borderColor: 'white', padding: 8 }}>
        <ErrorOverlayHeader
          isDismissable={true}
          onDismiss={onDismiss}
          onMinimize={onMinimize}
          onSelectIndex={onChangeSelectedIndex}
          level={'error'}
        />
      </View>
      <View style={{ borderWidth: 1, borderColor: 'white', padding: 8 }}>
        <ErrorOverlayHeader
          isDismissable={false}
          onDismiss={onDismiss}
          onMinimize={onMinimize}
          onSelectIndex={onChangeSelectedIndex}
          level={'fatal'}
        />
      </View>
    </View>
  );
}
