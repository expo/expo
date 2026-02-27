import {
  Host,
  Text as ComposeText,
  Column,
  Row,
  RNHostView,
  Card,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import { padding, size } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { Text as RNText, View, Pressable } from 'react-native';

export default function HostingRNViewsScreen() {
  const [counter, setCounter] = useState(0);
  const [boxSize, setBoxSize] = useState(200);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Mixing RN Components with Compose</ComposeText>
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
          </Column>
        </Card>
        <Card>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Dynamically increasing size</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 24 }}>
              <RNHostView matchContents>
                <Pressable
                  onPress={() => setBoxSize((prev) => prev + 10)}
                  onLongPress={() => setBoxSize(200)}
                  style={{
                    height: boxSize,
                    width: boxSize,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#9B59B6',
                    gap: 10,
                  }}>
                  <RNText style={{ color: 'white' }}>Tap to increase size</RNText>
                  <View style={{ height: 1, width: '100%', backgroundColor: 'white' }} />
                  <RNText style={{ color: 'white' }}>Long press to reset size</RNText>
                </Pressable>
              </RNHostView>
            </Row>
          </Column>
        </Card>
        <Card>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>RN components without explicit size</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 20 }}>
              <RNHostView matchContents>
                <View
                  style={{
                    padding: 20,
                    alignSelf: 'flex-start',
                    backgroundColor: '#9B59B6',
                    borderRadius: 10,
                  }}
                />
              </RNHostView>
              <RNHostView matchContents>
                <View
                  style={{
                    padding: 20,
                    alignSelf: 'flex-start',
                    backgroundColor: '#9B59B6',
                    borderRadius: 10,
                  }}
                />
              </RNHostView>
            </Row>
          </Column>
        </Card>
        <Card>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>RN components with flex: 1 children</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 20 }} modifiers={[size(100, 100)]}>
              <RNHostView>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#9B59B6',
                    borderRadius: 10,
                  }}
                />
              </RNHostView>
            </Row>
          </Column>
        </Card>
        <Card>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <RNHostView matchContents>
              <RNText style={{ textAlign: 'center' }}>RN Text inside SwiftUI</RNText>
            </RNHostView>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

HostingRNViewsScreen.navigationOptions = {
  title: 'Hosting RN Views',
};
