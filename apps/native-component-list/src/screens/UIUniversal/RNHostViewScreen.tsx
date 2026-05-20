import { Host, Column, Row, Text, RNHostView, ScrollView } from '@expo/ui';
import { View } from 'react-native';

export default function RNHostViewScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Fill parent size</Text>
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>
              The RNHostView fills the native parent's 100×100 frame.
            </Text>
            <Row
              style={{
                width: 100,
                height: 100,
              }}>
              <RNHostView>
                <View
                  style={{ flex: 1, backgroundColor: '#9B59B6', borderRadius: 10, margin: 4 }}
                />
              </RNHostView>
            </Row>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Match child size</Text>
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>
              The RNHostView shrinks to wrap its 50×50 child.
            </Text>
            <Row
              style={{
                padding: 8,
              }}>
              <RNHostView matchContents>
                <View
                  style={{ width: 50, height: 50, backgroundColor: '#9B59B6', borderRadius: 10 }}
                />
              </RNHostView>
            </Row>
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

RNHostViewScreen.navigationOptions = {
  title: 'RNHostView',
};
