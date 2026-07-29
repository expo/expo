import {
  Host,
  Text as ComposeText,
  Column,
  Row,
  RNHostView,
  Card,
  LazyColumn,
  LazyRow,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, size } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { Text as RNText, View, Pressable, FlatList } from 'react-native';

const LAZY_ROW_BUTTONS = ['Button One', 'Button Two', 'Button Three', 'Button Four'];

export default function HostingRNViewsScreen() {
  const [counter, setCounter] = useState(0);
  const [boxSize, setBoxSize] = useState(200);
  const [lastPress, setLastPress] = useState<{ label: string; count: number } | null>(null);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
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
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Pressables inside a Compose LazyRow</ComposeText>
            <ComposeText>
              {`Regression test for presses on hosted RN content (#48131): taps, presses with slight finger movement, and presses on items scrolled into view must all fire, and must hit the button under the finger. Last press: ${lastPress ? `${lastPress.label} (${lastPress.count})` : 'none'}`}
            </ComposeText>
            <LazyRow horizontalArrangement={{ spacedBy: 12 }}>
              {LAZY_ROW_BUTTONS.map((label) => (
                <RNHostView key={label} matchContents>
                  <Pressable
                    onPress={() =>
                      setLastPress((prev) => ({
                        label,
                        count: prev?.label === label ? prev.count + 1 : 1,
                      }))
                    }
                    style={{
                      width: 144,
                      height: 56,
                      borderRadius: 999,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#9B59B6',
                    }}>
                    <RNText style={{ color: 'white', fontWeight: '600' }}>{label}</RNText>
                  </Pressable>
                </RNHostView>
              ))}
            </LazyRow>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
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

        <Card modifiers={[fillMaxWidth()]}>
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
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Nested scroll RN ScrollView inside Compose LazyColumn</ComposeText>
            <RNHostView matchContents>
              <FlatList
                style={{ height: 200 }}
                nestedScrollEnabled
                data={Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`)}
                keyExtractor={(item) => item}
                renderItem={({ item }) => <RNText style={{ alignSelf: 'center' }}>{item}</RNText>}
              />
            </RNHostView>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
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

        <Card modifiers={[fillMaxWidth()]}>
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
