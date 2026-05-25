import { Collapsible, Column, Host, List, ScrollView, Text } from '@expo/ui';
import { useState } from 'react';

export default function CollapsibleScreen() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [exclusiveOpen, setExclusiveOpen] = useState<'a' | 'b' | 'c' | null>('a');
  const [listFaqOpen, setListFaqOpen] = useState(false);
  const [listShippingOpen, setListShippingOpen] = useState(false);
  const [listReturnsOpen, setListReturnsOpen] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Basic (independent)</Text>
            <Collapsible isOpen={aboutOpen} onOpenChange={setAboutOpen} label="About">
              <Text>
                A primitive that toggles visibility of its content via a labelled tappable header.
                Each collapsible manages its own state — multiple can be open simultaneously.
              </Text>
            </Collapsible>
            <Collapsible isOpen={detailsOpen} onOpenChange={setDetailsOpen} label="Details">
              <Column spacing={4}>
                <Text>Backed by SwiftUI DisclosureGroup on iOS.</Text>
                <Text>Backed by Compose Row + clickable + AnimatedVisibility on Android.</Text>
                <Text>Backed by native &lt;details&gt; / &lt;summary&gt; on web.</Text>
              </Column>
            </Collapsible>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Accordion (one-at-a-time)</Text>
            <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>
              Wire each Collapsible's open state to a shared parent value to get accordion
              semantics. The library doesn't enforce this — composition is the consumer's call.
            </Text>
            <Collapsible
              isOpen={exclusiveOpen === 'a'}
              onOpenChange={(open) => setExclusiveOpen(open ? 'a' : null)}
              label="Section A">
              <Text>Opening B or C closes this one.</Text>
            </Collapsible>
            <Collapsible
              isOpen={exclusiveOpen === 'b'}
              onOpenChange={(open) => setExclusiveOpen(open ? 'b' : null)}
              label="Section B">
              <Text>Opening A or C closes this one.</Text>
            </Collapsible>
            <Collapsible
              isOpen={exclusiveOpen === 'c'}
              onOpenChange={(open) => setExclusiveOpen(open ? 'c' : null)}
              label="Section C">
              <Text>Opening A or B closes this one.</Text>
            </Collapsible>
            <Text>{`Currently open: ${exclusiveOpen ?? 'none'}`}</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Inside a List</Text>
            <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>
              On iOS, nesting Collapsibles in a List picks up the inherited foreground style — the
              header reads in the primary label color instead of the standalone accent tint. On
              Android and web the appearance is unchanged.
            </Text>
            <Column style={{ height: 280 }}>
              <List>
                <Collapsible
                  isOpen={listFaqOpen}
                  onOpenChange={setListFaqOpen}
                  label="What is Expo UI?">
                  <Text>
                    A set of cross-platform primitives that render with SwiftUI on iOS, Jetpack
                    Compose on Android, and HTML on web.
                  </Text>
                </Collapsible>
                <Collapsible
                  isOpen={listShippingOpen}
                  onOpenChange={setListShippingOpen}
                  label="Shipping">
                  <Text>Orders ship within 2 business days.</Text>
                </Collapsible>
                <Collapsible
                  isOpen={listReturnsOpen}
                  onOpenChange={setListReturnsOpen}
                  label="Returns">
                  <Text>Free returns within 30 days of delivery.</Text>
                </Collapsible>
              </List>
            </Column>
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

CollapsibleScreen.navigationOptions = {
  title: 'Collapsible',
};
