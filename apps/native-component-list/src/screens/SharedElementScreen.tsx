import * as React from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createAppContainer, NavigationScreenProp, NavigationState } from 'react-navigation';
import { createSharedElementStackNavigator, SharedElement } from 'react-navigation-shared-element';
import { createStackNavigator } from 'react-navigation-stack';

import { Colors } from '../constants';

export const DetailScreen = () => (
  <View style={styles.detailContainer}>
    {/* `style` isn't properly typed on SharedElement
    // @ts-ignore */}
    <SharedElement id="image" style={StyleSheet.absoluteFill}>
      <Image
        style={styles.detailImage}
        resizeMode="cover"
        source={require('../../assets/images/large-example.jpg')}
      />
    </SharedElement>
    <SharedElement id="text">
      <Text style={styles.detailText}>Kelingking</Text>
    </SharedElement>
  </View>
);

DetailScreen.navigationOptions = {
  title: 'Photo by Kilarov Zaneit',
};

DetailScreen.sharedElements = () => [{ id: 'image' }, { id: 'text', animation: 'fade' }];

interface Props {
  navigation: NavigationScreenProp<NavigationState & any>;
}

class MainScreen extends React.Component<Props> {
  static navigationOptions = {
    title: 'react-native-shared-element',
  };

  render() {
    return (
      <TouchableOpacity style={styles.flex} onPress={this.onPress} activeOpacity={0.5}>
        <View style={styles.container}>
          <SharedElement id="image">
            <Image style={styles.image} source={require('../../assets/images/large-example.jpg')} />
          </SharedElement>
          <SharedElement id="text">
            <Text style={styles.text}>Kelingking</Text>
          </SharedElement>
          <Text style={styles.caption}>tap to enlarge</Text>
        </View>
      </TouchableOpacity>
    );
  }

  onPress = () => {
    this.props.navigation.navigate('Detail');
  };
}

function springyFadeIn() {
  const transitionSpec = {
    timing: Animated.spring,
    tension: 10,
    useNativeDriver: true,
  };

  return {
    transitionSpec,
    screenInterpolator: ({ position, scene }: any) => {
      const { index } = scene;

      const opacity = position.interpolate({
        inputRange: [index - 1, index],
        outputRange: [0, 1],
      });

      return { opacity };
    },
  };
}

const StackNavigator: any = createSharedElementStackNavigator(
  createStackNavigator,
  {
    Main: MainScreen,
    Detail: DetailScreen,
  },
  {
    transitionConfig: () => springyFadeIn(),
    defaultNavigationOptions: {
      headerTintColor: Colors.tabIconSelected,
      headerTitleStyle: {
        color: '#000',
      },
    },
  }
);

const Navigator = createAppContainer(StackNavigator);
export default class SharedElementScreen extends React.Component<Props> {
  static navigationOptions = {
    header: null,
  };

  render() {
    return <Navigator screenProps={{ dismiss: () => this.props.navigation.goBack() }} detached />;
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 30,
    fontWeight: 'bold',
    fontSize: 35,
  },
  caption: {
    fontSize: 20,
    opacity: 0.5,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    resizeMode: 'cover',
  },
  detailContainer: {
    flex: 1,
    alignItems: 'center',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailText: {
    marginTop: 20,
    color: 'white',
    fontSize: 60,
    fontWeight: 'bold',
  },
});
