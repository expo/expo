import { Host, Column, Row, Text, ScrollView } from '@expo/ui';

const COLORS = [
  '#E3F2FD',
  '#FFF3E0',
  '#E8F5E9',
  '#FCE4EC',
  '#F3E5F5',
  '#E0F7FA',
  '#FFF9C4',
  '#F1F8E9',
  '#E8EAF6',
  '#FBE9E7',
  '#E0F2F1',
  '#FFECB3',
  '#EFEBE9',
  '#ECEFF1',
  '#FFF8E1',
  '#E1F5FE',
];

export default function ScrollViewScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Horizontal</Text>
            <ScrollView direction="horizontal">
              <Row spacing={8}>
                {COLORS.map((color, i) => (
                  <Column
                    key={color}
                    alignment="center"
                    style={{
                      backgroundColor: color,
                      width: 120,
                      height: 80,
                      borderRadius: 12,
                      padding: 8,
                    }}>
                    <Text textStyle={{ fontSize: 14, fontWeight: '600' }}>{`Card ${i + 1}`}</Text>
                  </Column>
                ))}
              </Row>
            </ScrollView>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>
              Horizontal (indicators hidden)
            </Text>
            <ScrollView direction="horizontal" showsIndicators={false}>
              <Row spacing={8}>
                {COLORS.map((color, i) => (
                  <Column
                    key={color}
                    alignment="center"
                    style={{
                      backgroundColor: color,
                      width: 120,
                      height: 80,
                      borderRadius: 12,
                      padding: 8,
                    }}>
                    <Text textStyle={{ fontSize: 14, fontWeight: '600' }}>{`Card ${i + 1}`}</Text>
                  </Column>
                ))}
              </Row>
            </ScrollView>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Vertical (nested)</Text>
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>
              This nested ScrollView scrolls independently from the parent.
            </Text>
            <ScrollView style={{ height: 200, backgroundColor: '#F5F5F5', borderRadius: 12 }}>
              <Column spacing={8} style={{ padding: 12 }}>
                {Array.from({ length: 20 }, (_, i) => (
                  <Column
                    key={i}
                    style={{
                      backgroundColor: COLORS[i % COLORS.length],
                      padding: 12,
                      borderRadius: 8,
                    }}>
                    <Text textStyle={{ fontSize: 14 }}>{`Item ${i + 1}`}</Text>
                  </Column>
                ))}
              </Column>
            </ScrollView>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>More content below</Text>
            <Text textStyle={{ color: '#666666' }}>
              These items sit below the nested scroll to prove the parent scrolls too.
            </Text>
          </Column>

          {Array.from({ length: 10 }, (_, i) => (
            <Row
              key={i}
              spacing={12}
              alignment="center"
              style={{ backgroundColor: '#ECEFF1', padding: 16, borderRadius: 12 }}>
              <Column
                alignment="center"
                style={{
                  backgroundColor: COLORS[i % COLORS.length],
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                }}>
                <Text textStyle={{ fontSize: 16, fontWeight: 'bold' }}>{`${i + 1}`}</Text>
              </Column>
              <Column spacing={2}>
                <Text textStyle={{ fontSize: 14, fontWeight: '600' }}>{`Section ${i + 1}`}</Text>
                <Text textStyle={{ fontSize: 12, color: '#666666' }}>
                  Extra content to make the parent scroll
                </Text>
              </Column>
            </Row>
          ))}

          <Column style={{ height: 40 }} />
        </Column>
      </ScrollView>
    </Host>
  );
}

ScrollViewScreen.navigationOptions = {
  title: 'ScrollView',
};
