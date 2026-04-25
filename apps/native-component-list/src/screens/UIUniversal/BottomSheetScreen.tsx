import { Host, Column, Text, Button, BottomSheet } from '@expo/ui';
import { useState } from 'react';

export default function BottomSheetScreen() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [noDragOpen, setNoDragOpen] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <Column spacing={16} style={{ padding: 16 }}>
        <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>BottomSheet</Text>

        <Button label="Open basic sheet" variant="filled" onPress={() => setBasicOpen(true)} />

        <Button
          label="Open sheet (no drag indicator)"
          variant="outlined"
          onPress={() => setNoDragOpen(true)}
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
    </Host>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
