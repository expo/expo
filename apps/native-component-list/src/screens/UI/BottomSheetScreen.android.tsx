import {
  Button,
  Card,
  Column,
  Host,
  LazyColumn,
  ModalBottomSheet,
  RNHostView,
  Row,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, height, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';

export default function BottomSheetScreen() {
  const [showRNContent, setShowRNContent] = React.useState(false);
  const [showRNContentWithFlex, setShowRNContentWithFlex] = React.useState(false);
  const [counter, setCounter] = React.useState(0);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>React Native Content</ComposeText>
            <ComposeText>Sheet with interactive RN views inside</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 12 }}>
              <Button onPress={() => setShowRNContent(true)}>Open RN Content Sheet</Button>
            </Row>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>React Native Content with flex: 1</ComposeText>
            <ComposeText>Sheet with RN views that fill available space</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 12 }}>
              <Button onPress={() => setShowRNContentWithFlex(true)}>
                Open Flex Content Sheet
              </Button>
            </Row>
          </Column>
        </Card>
      </LazyColumn>

      {showRNContent && (
        <ModalBottomSheet
          onDismissRequest={() => setShowRNContent(false)}
          skipPartiallyExpanded={false}>
          <Column verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Mixing Compose + RN in a Bottom Sheet</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 24 }} verticalAlignment="center">
              <RNHostView matchContents>
                <Pressable
                  onPress={() => setCounter((prev) => prev - 1)}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#9B59B6',
                  }}>
                  <RNText style={{ color: 'white', fontSize: 24 }}>-</RNText>
                </Pressable>
              </RNHostView>
              <ComposeText>{counter}</ComposeText>
              <RNHostView matchContents>
                <Pressable
                  onPress={() => setCounter((prev) => prev + 1)}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#9B59B6',
                  }}>
                  <RNText style={{ color: 'white', fontSize: 24 }}>+</RNText>
                </Pressable>
              </RNHostView>
            </Row>
            <RNHostView matchContents>
              <View style={{ padding: 24 }}>
                <RNText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                  React Native Content
                </RNText>
                <RNText style={{ color: '#666', marginBottom: 16 }}>Counter: {counter}</RNText>
                <Pressable
                  style={{
                    backgroundColor: '#007AFF',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                  onPress={() => setCounter((prev) => prev + 1)}>
                  <RNText style={{ color: 'white', fontWeight: '600' }}>Increment</RNText>
                </Pressable>
                <Pressable
                  style={{
                    backgroundColor: '#FF3B30',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowRNContent(false)}>
                  <RNText style={{ color: 'white', fontWeight: '600' }}>Close</RNText>
                </Pressable>
              </View>
            </RNHostView>
          </Column>
        </ModalBottomSheet>
      )}

      {showRNContentWithFlex && (
        <ModalBottomSheet
          onDismissRequest={() => setShowRNContentWithFlex(false)}
          skipPartiallyExpanded>
          <Column modifiers={[height(400), padding(16, 16, 16, 16)]}>
            <ComposeText>RN View with flex: 1</ComposeText>
            <RNHostView>
              <View style={{ flex: 1, backgroundColor: '#9B59B6', borderRadius: 10 }}>
                <RNText
                  style={{
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 'bold',
                    padding: 16,
                  }}>
                  React Native Content (flex: 1)
                </RNText>
              </View>
            </RNHostView>
          </Column>
        </ModalBottomSheet>
      )}
    </Host>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
