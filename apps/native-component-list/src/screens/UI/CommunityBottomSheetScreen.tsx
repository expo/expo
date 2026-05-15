import BottomSheet, {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  useBottomSheet,
} from '@expo/ui/community/bottom-sheet'; // can replace with `@gorhom/bottom-sheet` to check compatibility
import { useRef, useState } from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function SheetControls({ snapCount = 0 }: { snapCount?: number }) {
  const { close, snapToIndex } = useBottomSheet();

  return (
    <View style={styles.sheetContent}>
      {snapCount > 0 && (
        <View style={styles.buttonRow}>
          {Array.from({ length: snapCount }, (_, i) => (
            <Button key={i} title={`Snap ${i}`} onPress={() => snapToIndex(i)} />
          ))}
        </View>
      )}
      <Button title="Close" onPress={() => close()} />
    </View>
  );
}

export default function CommunityBottomSheetScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const modalRef = useRef<BottomSheetModal>(null);
  const fitRef = useRef<BottomSheetModal>(null);

  const [log, setLog] = useState<string[]>([]);
  const addLog = (msg: string) =>
    setLog((prev) => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 15));

  return (
    <GestureHandlerRootView style={styles.flex}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
          {/* 1. BottomSheet with snapPoints */}
          <Text style={styles.heading}>BottomSheet (snap points)</Text>
          <Text style={styles.hint}>snapPoints: 25%, 50%, 90%</Text>
          <View style={styles.buttonRow}>
            <Button title="Open" onPress={() => sheetRef.current?.snapToIndex(0)} />
          </View>

          {/* 2. BottomSheetModal with snapPoints */}
          <Text style={styles.heading}>BottomSheetModal (snap points)</Text>
          <Text style={styles.hint}>snapPoints: 40%, 80%</Text>
          <View style={styles.buttonRow}>
            <Button title="Open" onPress={() => modalRef.current?.present()} />
          </View>

          {/* 3. BottomSheetModal fit to content */}
          <Text style={styles.heading}>BottomSheetModal (fit to content)</Text>
          <Text style={styles.hint}>No snapPoints — sheet sizes to content</Text>
          <View style={styles.buttonRow}>
            <Button title="Open" onPress={() => fitRef.current?.present()} />
            <Button
              title="Open + auto-close 2s"
              onPress={() => {
                fitRef.current?.present();
                setTimeout(() => fitRef.current?.close(), 2000);
              }}
            />
          </View>

          {/* Event log */}
          <View style={styles.log}>
            <Text style={styles.logTitle}>Events</Text>
            {log.map((entry, i) => (
              <Text key={i} style={styles.logEntry}>
                {entry}
              </Text>
            ))}
          </View>

          {/* Sheet 1: BottomSheet with snap points */}
          <BottomSheet
            ref={sheetRef}
            snapPoints={['25%', '50%', '90%']}
            index={-1}
            onChange={(index) => addLog(`sheet onChange: ${index}`)}
            onClose={() => addLog('sheet onClose')}
            enablePanDownToClose>
            <BottomSheetView style={styles.sheetView}>
              <Text style={styles.sheetTitle}>BottomSheet</Text>
              {Platform.OS === 'android' && (
                <Text style={styles.hint}>
                  Android: snap buttons map to partial/expanded (2 states only)
                </Text>
              )}
              <SheetControls snapCount={3} />
            </BottomSheetView>
          </BottomSheet>

          {/* Sheet 2: BottomSheetModal with snap points */}
          <BottomSheetModal
            ref={modalRef}
            snapPoints={['40%', '80%']}
            onChange={(index) => addLog(`modal onChange: ${index}`)}
            onDismiss={() => addLog('modal onDismiss')}
            enablePanDownToClose>
            <BottomSheetView style={styles.sheetView}>
              <Text style={styles.sheetTitle}>BottomSheetModal</Text>
              {Platform.OS === 'android' && (
                <Text style={styles.hint}>
                  Android: snap buttons map to partial/expanded (2 states only)
                </Text>
              )}
              <SheetControls snapCount={2} />
            </BottomSheetView>
          </BottomSheetModal>

          {/* Sheet 3: BottomSheetModal fit to content */}
          <BottomSheetModal
            ref={fitRef}
            onChange={(index) => addLog(`fit onChange: ${index}`)}
            onDismiss={() => addLog('fit onDismiss')}
            enablePanDownToClose>
            <BottomSheetView style={styles.sheetView}>
              <Text style={styles.sheetTitle}>Fit to Content</Text>
              <Text style={styles.hint}>Sheet height matches this content</Text>
              <SheetControls />
            </BottomSheetView>
          </BottomSheetModal>
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

CommunityBottomSheetScreen.navigationOptions = {
  title: 'Community BottomSheet',
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#f5f5f5',
    gap: 4,
  },
  heading: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
  hint: {
    fontSize: 12,
    color: '#888',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  log: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  logEntry: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#444',
  },
  sheetView: {
    flex: 1,
  },
  sheetContent: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
});
