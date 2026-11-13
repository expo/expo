import { Host, Column, Row, Text, RNHostView, ScrollView } from '@expo/ui';
import { Text as RNText, View } from 'react-native';

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

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Match child height only</Text>
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>
              {
                'matchContents={ vertical: true }: width from the parent, height from the text. The purple box must stay on screen and grow to fit every line.'
              }
            </Text>
            <RNHostView matchContents={{ vertical: true }}>
              <View style={{ padding: 12, backgroundColor: '#9B59B6', borderRadius: 10 }}>
                <RNText style={{ color: 'white' }}>
                  This long React Native text wraps at the parent width and grows vertically. Before
                  per-axis matchContents it laid out on one line and overflowed its parent.
                </RNText>
              </View>
            </RNHostView>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Match child width only</Text>
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>
              {'matchContents={ horizontal: true }: height from the 60pt row, width from the text.'}
            </Text>
            <Row style={{ height: 60 }}>
              <RNHostView matchContents={{ horizontal: true }}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    backgroundColor: '#9B59B6',
                    borderRadius: 10,
                  }}>
                  <RNText style={{ color: 'white' }}>Hugs its label</RNText>
                </View>
              </RNHostView>
            </Row>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>
              Text wrapping without matchContents
            </Text>
            <Text textStyle={{ fontSize: 12, color: '#666666' }}>
              The host fills the 100pt row, and flex: 1 fills the host. The text wraps at the row
              width, but the height comes from the row, not from the text.
            </Text>
            <Row style={{ height: 100 }}>
              <RNHostView>
                <View
                  style={{ flex: 1, padding: 12, backgroundColor: '#9B59B6', borderRadius: 10 }}>
                  <RNText style={{ color: 'white' }}>
                    This text wraps at the parent width. The host has no matchContents, so its size
                    comes from the parent.
                  </RNText>
                </View>
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
