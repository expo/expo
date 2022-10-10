import { NavigationContainer } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';
import * as React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createSharedElementStackNavigator, SharedElement } from 'react-navigation-shared-element';

import { Colors } from '../constants';

const Stack = createSharedElementStackNavigator();

export function DetailScreen() {
  return (
    <View style={styles.detailContainer}>
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
}

function MainScreen({ navigation }: { navigation: StackNavigationProp<{ Detail: undefined }> }) {
  return (
    <TouchableOpacity
      style={styles.flex}
      onPress={() => navigation.navigate('Detail')}
      activeOpacity={0.5}>
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

const spec: TransitionSpec = {
  animation: 'spring',
  config: {
    tension: 10,
  },
};

export default function SharedElementScreen() {
  return (
    <NavigationContainer independent>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerTintColor: Colors.tabIconSelected,
          headerTitleStyle: { color: '#000' },
          transitionSpec: {
            open: spec,
            close: spec,
          },
          cardStyleInterpolator: ({ index, current }) => {
            const opacity = current.progress.interpolate({
              inputRange: [index - 1, index],
              outputRange: [0, 1],
            });

            return { cardStyle: { opacity } };
          },
        }}>
        <Stack.Screen
          options={{
            title: 'react-native-shared-element',
          }}
          name="Main"
          component={MainScreen}
        />
        <Stack.Screen
          name="Detail"
          options={{
            title: 'Photo by Kilarov Zaneit',
          }}
          component={DetailScreen}
          sharedElements={() => [{ id: 'image' }, { id: 'text', animation: 'fade' }]}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
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
