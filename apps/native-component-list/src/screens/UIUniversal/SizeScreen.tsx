import { Host, Column, Row, Text, ScrollView } from '@expo/ui';

const track = '#E3F2FD';
const full = '#1565C0';
const half = '#42A5F5';
const quarter = '#90CAF9';

export default function SizeScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24} style={{ width: '100%' }}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Width</Text>
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>
              Each bar is a percentage of this column.
            </Text>
            <Column
              testID="universal-size-full"
              style={{ width: '100%', height: 28, backgroundColor: full, borderRadius: 6 }}
            />
            <Column
              testID="universal-size-half"
              style={{ width: '50%', height: 28, backgroundColor: half, borderRadius: 6 }}
            />
            <Column
              testID="universal-size-quarter"
              style={{ width: '25%', height: 28, backgroundColor: quarter, borderRadius: 6 }}
            />
            <Column
              testID="universal-size-fixed"
              style={{ width: 80, height: 28, backgroundColor: '#0D47A1', borderRadius: 6 }}
            />
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>The last bar is 80pt wide.</Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Row split</Text>
            <Row testID="universal-size-row" spacing={8} style={{ width: '100%', height: 64 }}>
              <Column
                testID="universal-size-row-start"
                style={{
                  width: '30%',
                  height: '100%',
                  backgroundColor: full,
                  borderRadius: 6,
                }}
              />
              <Column
                testID="universal-size-row-end"
                style={{
                  width: '70%',
                  height: '100%',
                  backgroundColor: half,
                  borderRadius: 6,
                }}
              />
            </Row>
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>
              30% then 70%, both full height.
            </Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Nested</Text>
            <Column
              spacing={8}
              style={{
                width: '80%',
                backgroundColor: track,
                padding: 12,
                borderRadius: 8,
              }}>
              <Text textStyle={{ fontSize: 12 }}>Outer column is 80% wide.</Text>
              <Column
                testID="universal-size-nested"
                style={{ width: '50%', height: 28, backgroundColor: full, borderRadius: 6 }}
              />
              <Text textStyle={{ fontSize: 12, color: '#666666' }}>
                Inner bar is 50% of the outer column.
              </Text>
            </Column>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Alignment</Text>
            {(['start', 'center', 'end'] as const).map((align) => (
              <Column
                key={align}
                alignment={align}
                style={{
                  width: '100%',
                  backgroundColor: track,
                  padding: 8,
                  borderRadius: 8,
                }}>
                <Column
                  style={{ width: '40%', height: 24, backgroundColor: half, borderRadius: 4 }}
                />
                <Text textStyle={{ fontSize: 12 }}>{align}</Text>
              </Column>
            ))}
          </Column>

          <Column style={{ height: 40 }} />
        </Column>
      </ScrollView>
    </Host>
  );
}

SizeScreen.navigationOptions = {
  title: 'Size',
};
