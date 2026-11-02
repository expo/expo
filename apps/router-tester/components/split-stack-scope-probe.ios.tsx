import { requireNativeView } from 'expo';
import { useState } from 'react';
import { Button, Text, View, type ViewProps } from 'react-native';

interface Snapshot {
  revision: number;
  controllers: string[];
  navigationControllers: {
    name: string;
    depth: number;
    headerHidden: boolean;
    gestures: {
      name: string;
      enabled: boolean;
      state: number;
      delegate: string;
      isInteractivePop: boolean;
      isContentPop: boolean;
    }[];
    markerInTopScreen: boolean;
  }[];
  splitState: string;
}

const NativeProbe = requireNativeView<
  ViewProps & {
    revision: number;
    onSnapshot: (event: { nativeEvent: Snapshot }) => void;
  }
>('ExpoRouterSplitViewModule', 'SplitViewStackProbeView');

export function StackProbe() {
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  return (
    <View>
      <NativeProbe
        revision={revision}
        onSnapshot={(event) => setSnapshot(event.nativeEvent)}
        pointerEvents="none"
        style={{ position: 'absolute', width: 0, height: 0 }}
      />
      <Button title="Inspect native ancestry" onPress={() => setRevision((value) => value + 1)} />
      <Text selectable>
        {snapshot
          ? JSON.stringify(snapshot, null, 2)
          : 'Waiting for native probe; requires a rebuilt client.'}
      </Text>
      <Text>
        Snapshot only. Inspect again after navigation/rotation. Containment does not establish
        active ownership.
      </Text>
    </View>
  );
}
