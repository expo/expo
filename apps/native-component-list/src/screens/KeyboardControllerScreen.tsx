import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  StyleSheet,
  Platform,
  FlatList,
  StatusBar,
  TextInput,
  View,
  ViewStyle,
  Text,
  Image,
  TextStyle,
} from 'react-native';
import { KeyboardProvider, useKeyboardHandler } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface Message {
  author: 'Keith' | 'Beto';
  message: string;
  image: string | null;
  createdAt: Date;
}

function MessageItem({ message }: { message: Message }) {
  const photoSrc = message.author === 'Keith' ? KeithPhoto : BetoPhoto;
  const author = message.author === 'Keith' ? 'Keith' : 'Beto';

  const containerStyle: ViewStyle = {
    gap: 8,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: message.author === 'Keith' ? 'flex-start' : 'flex-end',
  };

  const messageContainerStyle: ViewStyle = {
    backgroundColor: message.author === 'Keith' ? '#218aff' : '#d8d8d8',
  };

  const textStyle: TextStyle = {
    color: message.author === 'Keith' ? '#fff' : '#000',
  };

  return (
    <View style={containerStyle}>
      {author === 'Keith' && (
        <View>
          <Image source={{ uri: photoSrc }} style={styles.photo} />
          <Text>{author}</Text>
        </View>
      )}
      <View style={StyleSheet.compose(styles.messageContainer, messageContainerStyle)}>
        {message.image && (
          <Image
            source={{ uri: message.image }}
            style={{
              width: 'auto',
              height: 200,
              borderRadius: 8,
              marginBottom: 8,
            }}
          />
        )}
        <Text style={textStyle}>{message.message}</Text>
      </View>
    </View>
  );
}

const useGradualAnimation = () => {
  const height = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: (e) => {
        'worklet';
        // set height to min 10
        height.value = e.height;
      },
      onEnd: (e) => {
        'worklet';
        height.value = e.height;
      },
    },
    []
  );
  return { height };
};

function KeyboardControllerExample() {
  const { height } = useGradualAnimation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const bottomTabBarHeight = Platform.OS === 'ios' ? useBottomTabBarHeight() : 0;

  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value) - bottomTabBarHeight,
    };
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageItem message={item} />}
        keyExtractor={(item) => item.createdAt.toString()}
        contentContainerStyle={styles.listStyle}
        keyboardDismissMode="on-drag"
        inverted
      />
      <TextInput placeholder="Type a message..." style={styles.textInput} />
      <Animated.View style={fakeView} />
    </View>
  );
}

export default function KeyboardControllerScreen() {
  return (
    <KeyboardProvider>
      <KeyboardControllerExample />
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  listStyle: {
    padding: 16,
    gap: 16,
  },
  textInput: {
    width: '95%',
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#d8d8d8',
    backgroundColor: '#fff',
    padding: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },

  messageContainer: {
    borderRadius: 8,
    padding: 8,
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

const KeithPhoto = 'https://avatars.githubusercontent.com/u/8053974?v=4';
const BetoPhoto = 'https://avatars.githubusercontent.com/u/43630417?v=4';

const messages: Message[] = [
  {
    author: 'Keith',
    message: 'Hey Beto, have you tried using Expo for React Native development?',
    image: null,
    createdAt: new Date('2024-08-08T10:00:00Z'),
  },
  {
    author: 'Beto',
    message: "Yeah, I started using it last month. It's amazing!",
    image: null,
    createdAt: new Date('2024-08-08T10:02:00Z'),
  },
  {
    author: 'Keith',
    message:
      'I know, right? The setup process is so smooth. No more dealing with native build tools.',
    image: null,
    createdAt: new Date('2024-08-08T10:04:00Z'),
  },
  {
    author: 'Beto',
    message: 'Absolutely! And the hot reloading feature is a game-changer. Look at this demo:',
    image:
      'https://as2.ftcdn.net/v2/jpg/05/34/48/37/1000_F_534483775_2hBgOxryd3El6t3tKOtbcM95Yq3OmTGG.jpg',
    createdAt: new Date('2024-08-08T10:07:00Z'),
  },
  {
    author: 'Keith',
    message:
      "That's awesome! I love how Expo handles all the heavy lifting with notifications and updates too.",
    image: null,
    createdAt: new Date('2024-08-08T10:10:00Z'),
  },
  {
    author: 'Beto',
    message:
      'Definitely. And have you tried Expo Go? Testing on physical devices has never been easier.',
    image: null,
    createdAt: new Date('2024-08-08T10:12:00Z'),
  },
  {
    author: 'Keith',
    message:
      "Oh yeah, it's fantastic. No need to mess with Apple developer accounts just to test on iOS.",
    image: null,
    createdAt: new Date('2024-08-08T10:15:00Z'),
  },
  {
    author: 'Beto',
    message:
      "Exactly! And look at this chart showing how much time I've saved since switching to Expo:",
    image: null,
    createdAt: new Date('2024-08-08T10:18:00Z'),
  },
  {
    author: 'Keith',
    message:
      'Those are impressive numbers! The Expo SDK is so comprehensive too. It covers almost everything I need.',
    image: null,
    createdAt: new Date('2024-08-08T10:21:00Z'),
  },
  {
    author: 'Beto',
    message: 'True, and when you do need to add custom native code, EAS makes it straightforward.',
    image: null,
    createdAt: new Date('2024-08-08T10:24:00Z'),
  },
  {
    author: 'Keith',
    message:
      "Expo has really transformed my React Native workflow. I can't imagine going back to the old way of doing things.",
    image: null,
    createdAt: new Date('2024-08-08T10:27:00Z'),
  },
  {
    author: 'Beto',
    message: "Same here! It's made development so much more enjoyable. Cheers to Expo! 🎉",
    image:
      'https://cdn.prod.website-files.com/5e740d74e6787687577e9b38/63978bf83d789b4602145daf_maximizing-efficiency-and-productivity-with-expo-dev-tools-2.png',
    createdAt: new Date('2024-08-08T10:30:00Z'),
  },
];
