import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Animated, Button, Image, StyleSheet, TextInput, View } from 'react-native';

export { default as LifecycleAwareView } from './LifecycleAwareView';

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
      ...StyleSheet.absoluteFillObject,
    }}
  />
);

type Links = { Details: undefined | { index?: number } };

type Props = StackScreenProps<Links, 'Details'>;

class DetailsScreen extends React.Component<Props, { count: number; text: string }> {
  animvalue = new Animated.Value(0);
  rotation = this.animvalue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  state = { count: 1, text: '' };
  componentDidMount() {
    Animated.loop(
      Animated.timing(this.animvalue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      })
    ).start();
    setInterval(() => this.setState(({ count }) => ({ count: count + 1 })), 500);
  }
  render() {
    const index = this.props.route.params?.index ?? 0;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Background index={index} />
        <Button
          title="More details"
          onPress={() =>
            this.props.navigation.push('Details', {
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

const Stack = createStackNavigator();

const App = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Details"
      component={DetailsScreen}
      options={({ route }) => {
        return {
          title: 'Details screen #' + ((route.params as any)?.index ?? '0'),
        };
      }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 20,
    alignSelf: 'stretch',
    borderColor: 'black',
  },
});

export default App;
