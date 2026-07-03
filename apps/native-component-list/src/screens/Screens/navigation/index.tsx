import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Animated, Button, Image, StyleSheet, TextInput, View } from 'react-native';

const IMGS = [
  require('./img/dawid-zawila-628275-unsplash.jpg'),
  require('./img/dawid-zawila-715178-unsplash.jpg'),
  require('./img/janusz-maniak-143024-unsplash.jpg'),
  require('./img/janusz-maniak-272680-unsplash.jpg'),
];

const Background: React.FunctionComponent<{ index: number }> = ({ index }) => (
  <Image
    resizeMode="cover"
    source={IMGS[index % IMGS.length]}
    style={{
      opacity: 0.5,
      width: undefined,
      height: undefined,
      ...StyleSheet.absoluteFill,
    }}
  />
);

type Links = { ScreensNavigation: undefined | { index?: number } };

type Props = NativeStackScreenProps<Links, 'ScreensNavigation'>;

// This screen demos react-navigation stack pushes backed by react-native-screens.
// It pushes itself repeatedly instead of wrapping its own navigator.
class DetailsScreen extends React.Component<Props, { count: number; text: string }> {
  animvalue = new Animated.Value(0);
  rotation = this.animvalue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  state = { count: 1, text: '' };
  componentDidMount() {
    this.props.navigation.setOptions({
      title: 'Details screen #' + this.getIndex(),
    });
    Animated.loop(
      Animated.timing(this.animvalue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      })
    ).start();
    setInterval(() => this.setState(({ count }) => ({ count: count + 1 })), 500);
  }
  getIndex(): number {
    // Params may arrive as strings when set from a deep link.
    return Number(this.props.route.params?.index ?? 0);
  }
  render() {
    const index = this.getIndex();
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Background index={index} />
        <Button
          title="More details"
          onPress={() =>
            this.props.navigation.push('ScreensNavigation', {
              index: index + 1,
            })
          }
        />
        <TextInput
          placeholder="Hello"
          style={styles.textInput}
          onChangeText={(text) => this.setState({ text })}
          value={this.state.text}
        />
        <Animated.View
          style={{
            transform: [
              {
                rotate: this.rotation,
              },
            ],
            marginTop: 20,
            borderColor: 'blue',
            borderWidth: 3,
            width: 20,
            height: 20,
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 20,
    alignSelf: 'stretch',
    borderColor: 'black',
  },
});

export default DetailsScreen;
