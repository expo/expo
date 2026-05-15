import { Host, Column, Row, Text, ScrollView } from '@expo/ui';
import { useState } from 'react';

export default function ColumnScreen() {
  const [tapped, setTapped] = useState('None');

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Alignment</Text>
            <Row spacing={8}>
              {(['start', 'center', 'end'] as const).map((align) => (
                <Column
                  key={align}
                  alignment={align}
                  style={{
                    backgroundColor: '#E3F2FD',
                    padding: 12,
                    borderRadius: 8,
                    width: 100,
                    height: 100,
                  }}>
                  <Text textStyle={{ fontSize: 12, fontWeight: 'bold' }}>{align}</Text>
                  <Text textStyle={{ fontSize: 10 }}>item</Text>
                </Column>
              ))}
            </Row>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Spacing</Text>
            <Row spacing={12}>
              {[0, 4, 12, 24].map((gap) => (
                <Column
                  key={gap}
                  spacing={gap}
                  style={{ backgroundColor: '#FFF3E0', padding: 8, borderRadius: 8 }}>
                  <Text textStyle={{ fontSize: 10, fontWeight: 'bold' }}>{`gap=${gap}`}</Text>
                  <Column
                    style={{ backgroundColor: '#FFB74D', width: 40, height: 12, borderRadius: 4 }}
                  />
                  <Column
                    style={{ backgroundColor: '#FFB74D', width: 40, height: 12, borderRadius: 4 }}
                  />
                  <Column
                    style={{ backgroundColor: '#FFB74D', width: 40, height: 12, borderRadius: 4 }}
                  />
                </Column>
              ))}
            </Row>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Nested</Text>
            <Column
              spacing={8}
              style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8 }}>
              <Text textStyle={{ fontWeight: 'bold' }}>Outer column</Text>
              <Row spacing={8}>
                <Column style={{ backgroundColor: '#C8E6C9', padding: 8, borderRadius: 4 }}>
                  <Text textStyle={{ fontSize: 12 }}>Inner A</Text>
                </Column>
                <Column style={{ backgroundColor: '#C8E6C9', padding: 8, borderRadius: 4 }}>
                  <Text textStyle={{ fontSize: 12 }}>Inner B</Text>
                </Column>
              </Row>
            </Column>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Style props</Text>
            <Column
              style={{
                backgroundColor: '#1A237E',
                padding: 20,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: '#3F51B5',
              }}>
              <Text textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}>Styled container</Text>
              <Text textStyle={{ color: '#B3E5FC', fontSize: 12 }}>
                border, borderRadius, backgroundColor, padding
              </Text>
            </Column>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Interactive</Text>
            <Column
              onPress={() => setTapped('Column A')}
              style={{ backgroundColor: '#E8EAF6', padding: 12, borderRadius: 8 }}>
              <Text>Tappable column A</Text>
            </Column>
            <Column
              onPress={() => setTapped('Column B')}
              style={{ backgroundColor: '#E0F2F1', padding: 12, borderRadius: 8 }}>
              <Text>Tappable column B</Text>
            </Column>
            <Text>{`Last tapped: ${tapped}`}</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Disabled / Hidden</Text>
            <Column disabled style={{ backgroundColor: '#FFCDD2', padding: 12, borderRadius: 8 }}>
              <Text>Disabled (dimmed, not interactive)</Text>
            </Column>
            <Text textStyle={{ fontSize: 12, color: '#999999' }}>
              A hidden column exists below this text
            </Text>
            <Column hidden style={{ backgroundColor: '#C8E6C9', padding: 12, borderRadius: 8 }}>
              <Text>You should not see this</Text>
            </Column>
          </Column>

          <Column style={{ height: 40 }} />
        </Column>
      </ScrollView>
    </Host>
  );
}

ColumnScreen.navigationOptions = {
  title: 'Column',
};
