import { BottomSheet, Button, Column, Host, ScrollView, Text } from '@expo/ui';
import { useState } from 'react';

export default function BottomSheetScreen() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [noDragOpen, setNoDragOpen] = useState(false);
  const [detentsOpen, setDetentsOpen] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <Column spacing={12} style={{ padding: 16 }}>
        <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>BottomSheet</Text>

        <Button label="Open basic sheet" variant="filled" onPress={() => setBasicOpen(true)} />

        <Button
          label="Open sheet (no drag indicator)"
          variant="outlined"
          onPress={() => setNoDragOpen(true)}
        />

        <Button
          label="Open sheet with snap points (half / full)"
          variant="outlined"
          onPress={() => setDetentsOpen(true)}
        />
      </Column>

      <BottomSheet isPresented={basicOpen} onDismiss={() => setBasicOpen(false)}>
        <Column spacing={12} style={{ height: 130 }}>
          <Text textStyle={{ fontSize: 20, fontWeight: 'bold' }}>Hello from BottomSheet</Text>
          <Text numberOfLines={2}>
            This is a universal bottom sheet that works on iOS, Android, and web.
          </Text>
          <Button label="Close" variant="filled" onPress={() => setBasicOpen(false)} />
        </Column>
      </BottomSheet>

      <BottomSheet
        isPresented={noDragOpen}
        onDismiss={() => setNoDragOpen(false)}
        showDragIndicator={false}>
        <Column spacing={12}>
          <Text textStyle={{ fontSize: 20, fontWeight: 'bold' }}>No drag indicator</Text>
          <Text>This sheet has no drag indicator at the top.</Text>
          <Button label="Close" variant="filled" onPress={() => setNoDragOpen(false)} />
        </Column>
      </BottomSheet>

      <BottomSheet
        isPresented={detentsOpen}
        onDismiss={() => setDetentsOpen(false)}
        snapPoints={['half', 'full']}>
        {/* Wrap tall content in a ScrollView — see `SnapPoint` docs. */}
        <ScrollView>
          <Column spacing={12}>
            <Text textStyle={{ fontSize: 20, fontWeight: 'bold' }}>Snap points: half / full</Text>
            <Button label="Close" variant="filled" onPress={() => setDetentsOpen(false)} />
            <Text>
              Drag the sheet between half and full screen height. On iOS this maps to SwiftUI&apos;s
              .medium / .large detents; on Android to ModalBottomSheet&apos;s partial / expanded
              states.
            </Text>
            <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>
              Note: Android only shows the partial state when sheet content is tall enough to exceed
              the partial threshold — that&apos;s why this demo includes filler text below.
            </Text>
            <Text>Filler — line 1.</Text>
            <Text>Filler — line 2.</Text>
            <Text>Filler — line 3.</Text>
            <Text>Filler — line 4.</Text>
            <Text>Filler — line 5.</Text>
            <Text>Filler — line 6.</Text>
            <Text>Filler — line 7.</Text>
            <Text>Filler — line 8.</Text>
            <Text>Filler — line 9.</Text>
            <Text>Filler — line 10.</Text>
            <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>
              ↑ Footer — scroll down to see this line at the half detent, or drag the sheet to the
              full detent.
            </Text>
          </Column>
        </ScrollView>
      </BottomSheet>
    </Host>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
