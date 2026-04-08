import { Host, Column, Row, Text, ScrollView } from '@expo/ui';
import { useState } from 'react';

export default function RowScreen() {
  const [tapped, setTapped] = useState('None');

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Alignment (cross-axis)</Text>
            {(['start', 'center', 'end'] as const).map((align) => (
              <Row
                key={align}
                alignment={align}
                spacing={8}
                style={{
                  backgroundColor: '#FFF3E0',
                  padding: 12,
                  borderRadius: 8,
                  height: 60,
                }}>
                <Text textStyle={{ fontSize: 12, fontWeight: 'bold' }}>{align}</Text>
                <Text textStyle={{ fontSize: 24 }}>A</Text>
                <Text textStyle={{ fontSize: 14 }}>B</Text>
              </Row>
            ))}
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Spacing</Text>
            {[0, 8, 20].map((gap) => (
              <Row
                key={gap}
                spacing={gap}
                style={{ backgroundColor: '#E3F2FD', padding: 8, borderRadius: 8 }}>
                <Column
                  style={{ backgroundColor: '#90CAF9', width: 40, height: 30, borderRadius: 4 }}
                />
                <Column
                  style={{ backgroundColor: '#90CAF9', width: 40, height: 30, borderRadius: 4 }}
                />
                <Column
                  style={{ backgroundColor: '#90CAF9', width: 40, height: 30, borderRadius: 4 }}
                />
                <Text textStyle={{ fontSize: 10 }}>{`gap=${gap}`}</Text>
              </Row>
            ))}
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Nested</Text>
            <Row spacing={12} style={{ backgroundColor: '#F3E5F5', padding: 12, borderRadius: 8 }}>
              <Column
                spacing={4}
                style={{ backgroundColor: '#CE93D8', padding: 8, borderRadius: 4 }}>
                <Text textStyle={{ fontSize: 12, fontWeight: 'bold' }}>Left</Text>
                <Text textStyle={{ fontSize: 10 }}>Column</Text>
              </Column>
              <Column
                spacing={4}
                style={{ backgroundColor: '#CE93D8', padding: 8, borderRadius: 4 }}>
                <Text textStyle={{ fontSize: 12, fontWeight: 'bold' }}>Right</Text>
                <Text textStyle={{ fontSize: 10 }}>Column</Text>
              </Column>
            </Row>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Interactive</Text>
            <Row
              onPress={() => setTapped('Row A')}
              spacing={8}
              alignment="center"
              style={{ backgroundColor: '#E0F2F1', padding: 12, borderRadius: 8 }}>
              <Text>Tappable row A</Text>
            </Row>
            <Row
              onPress={() => setTapped('Row B')}
              spacing={8}
              alignment="center"
              style={{ backgroundColor: '#E8EAF6', padding: 12, borderRadius: 8 }}>
              <Text>Tappable row B</Text>
            </Row>
            <Text>{`Last tapped: ${tapped}`}</Text>
          </Column>

          <Column style={{ height: 40 }} />
        </Column>
      </ScrollView>
    </Host>
  );
}

RowScreen.navigationOptions = {
  title: 'Row',
};
