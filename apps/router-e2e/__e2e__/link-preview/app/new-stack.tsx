import { LinkMenu, LinkMenuAction, StackWithButtons } from 'expo-router';
import { Badge, Label } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const HomeIndex = () => {
  const [left1Hidden, setLeft1Hidden] = useState(true);
  const [largeTitle, setLargeTitle] = useState(false);
  return (
    <StackWithButtons>
      <StackWithButtons.Header>
        <StackWithButtons.Header.Title
          style={{ fontSize: 10 }}
          largeStyle={{ fontSize: 20, shadowColor: 'transparent', backgroundColor: 'transparent' }}
          large={largeTitle}>
          Link Preview Example
        </StackWithButtons.Header.Title>
        <StackWithButtons.Header.Left>
          <StackWithButtons.Header.Button
            onPress={() => alert('Left 1 pressed')}
            style={{ display: left1Hidden ? 'none' : 'flex' }}>
            Left 1
          </StackWithButtons.Header.Button>
          <LinkMenu title="Left Menu">
            <LinkMenuAction title="Menu Action 1" onPress={() => alert('Menu Action 1 pressed')} />
            <LinkMenuAction
              title="Destructive Action"
              destructive
              onPress={() => alert('Destructive Action pressed')}
            />
            <LinkMenuAction
              title="Enable large title"
              isOn={largeTitle}
              onPress={() => setLargeTitle((prev) => !prev)}
            />
          </LinkMenu>
          <StackWithButtons.Header.Button onPress={() => alert('Left 2 pressed')}>
            Left 2
          </StackWithButtons.Header.Button>
        </StackWithButtons.Header.Left>
        <StackWithButtons.Header.Right>
          <StackWithButtons.Header.Button onPress={() => alert('Right 1 pressed')}>
            <Label>Right 1</Label>
            <Badge>3</Badge>
          </StackWithButtons.Header.Button>
          <StackWithButtons.Header.Button onPress={() => alert('Right 2 pressed')}>
            Right 2
          </StackWithButtons.Header.Button>
        </StackWithButtons.Header.Right>
      </StackWithButtons.Header>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Pressable
          style={{ backgroundColor: '#eee', padding: 20, width: '100%' }}
          onPress={() => setLeft1Hidden((prev) => !prev)}>
          <Text>{left1Hidden ? 'Show' : 'Hide'} Left 1</Text>
        </Pressable>
        <Pressable
          style={{ backgroundColor: '#ccc', padding: 20, width: '100%' }}
          onPress={() => setLargeTitle((prev) => !prev)}>
          <Text>{largeTitle ? 'Hide' : 'Show'} Large Title</Text>
        </Pressable>
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            style={{ backgroundColor: i % 2 === 0 ? '#eee' : '#ccc', padding: 20, width: '100%' }}>
            <Text>Item {i + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </StackWithButtons>
  );
};

export default HomeIndex;
