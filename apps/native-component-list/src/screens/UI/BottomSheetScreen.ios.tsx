import { useState } from 'react';
import { Host, BottomSheet, Button, List, Section, Text, VStack, Group } from '@expo/ui/swift-ui';
import {
  presentationDetents,
  presentationDragIndicator,
  foregroundStyle,
} from '@expo/ui/swift-ui/modifiers';
import type { PresentationDetent } from '@expo/ui/swift-ui/modifiers';

export default function BottomSheetWithDetentSelectionExample() {
  const [isPresented, setIsPresented] = useState(false);
  const detents: PresentationDetent[] = [{ height: 300 }, { fraction: 0.3 }, 'medium', 'large'];
  const [selectedDetent, setSelectedDetent] = useState<PresentationDetent>('medium');

  const formatDetent = (detent: PresentationDetent): string => {
    if (typeof detent === 'string') return detent;
    if ('fraction' in detent) return `Fraction ${detent.fraction}`;
    return `Height ${detent.height}`;
  };

  return (
    <Host style={{ flex: 1 }}>
      <VStack>
        <Button label="Show Sheet" onPress={() => setIsPresented(true)} />
        <BottomSheet isPresented={isPresented} onIsPresentedChange={setIsPresented}>
          <Group
            modifiers={[
              presentationDetents(detents, {
                selection: selectedDetent,
                onSelectionChange: setSelectedDetent,
              }),
              presentationDragIndicator('visible'),
            ]}>
            <List>
              <Section title="Change Detent">
                <Button label="Height 300" onPress={() => setSelectedDetent({ height: 300 })} />
                <Button label="Fraction 0.3" onPress={() => setSelectedDetent({ fraction: 0.3 })} />
                <Button label="Medium" onPress={() => setSelectedDetent('medium')} />
                <Button label="Large" onPress={() => setSelectedDetent('large')} />
              </Section>
              <Section title="Current">
                <Text modifiers={[foregroundStyle('secondaryLabel')]}>
                  {formatDetent(selectedDetent)}
                </Text>
              </Section>
            </List>
          </Group>
        </BottomSheet>
      </VStack>
    </Host>
  );
}
