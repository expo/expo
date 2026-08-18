import { Column, Host, Row, Spacer, Text } from '@expo/ui';

export default function SpacerScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <Column spacing={24} style={{ padding: 16 }}>
        <Column spacing={8}>
          <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Fixed-size Spacer (Row)</Text>
          <Row
            alignment="center"
            style={{
              backgroundColor: '#E3F2FD',
              padding: 12,
              borderRadius: 8,
            }}>
            <Text>Left</Text>
            <Spacer size={32} />
            <Text>32px gap</Text>
            <Spacer size={8} />
            <Text>8px gap</Text>
          </Row>
        </Column>

        <Column spacing={8}>
          <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Flexible Spacer (Row)</Text>
          <Row
            alignment="center"
            style={{
              backgroundColor: '#FFF3E0',
              padding: 12,
              borderRadius: 8,
            }}>
            <Text>Left</Text>
            <Spacer flexible />
            <Text>Right</Text>
          </Row>
        </Column>

        <Column spacing={8}>
          <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Fixed-size Spacer (Column)</Text>
          <Column style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8 }}>
            <Text>Top</Text>
            <Spacer size={24} />
            <Text>24px below top</Text>
            <Spacer size={8} />
            <Text>8px below</Text>
          </Column>
        </Column>

        <Column spacing={8}>
          <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Flexible Spacer (Column)</Text>
          <Column
            style={{
              backgroundColor: '#F3E5F5',
              padding: 12,
              borderRadius: 8,
              height: 180,
            }}>
            <Text>Top</Text>
            <Spacer flexible />
            <Text>Bottom</Text>
          </Column>
        </Column>
      </Column>
    </Host>
  );
}

SpacerScreen.navigationOptions = {
  title: 'Spacer',
};
