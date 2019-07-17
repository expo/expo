import {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  FontAwesome5,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial,
} from '@expo/vector-icons';
import * as Font from 'expo-font';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const title = 'Font';
export const label = 'Font';

export const packageJson = require('expo-font/package.json');
export class component extends React.Component {
  state = {};
  constructor(...props) {
    super(...props);
    this._loadAssetsAsync();
  }

  async _loadAssetsAsync() {
    // try {
    //     Font.loadAsync({
    //       Roboto: 'https://github.com/google/fonts/raw/master/apache/roboto/Roboto-Regular.ttf',
    //     }),
    // } catch (error) {
    //     this.setState({ })
    // }

    try {
      await Promise.all([
        ...[
          AntDesign,
          Entypo,
          EvilIcons,
          Feather,
          FontAwesome,
          FontAwesome5,
          Foundation,
          Ionicons,
          MaterialCommunityIcons,
          MaterialIcons,
          Octicons,
          SimpleLineIcons,
          Zocial,
        ].map(icon => Font.loadAsync(icon.font)),

        Font.loadAsync(
          Object.keys(Font.FontDisplay).reduce(
            (acc, key) => ({
              ...acc,
              [`comic-${key}`]: {
                uri: require('../../assets/comic.ttf'),
                display: Font.FontDisplay[key],
              },
            }),
            {}
          )
        ),
      ]);
      this.setState({ loadedWithoutError: true });
    } catch (e) {
      console.log('Error loading fonts: ', e);
      this.setState({ loadedWithoutError: false });
    } finally {
    }
  }

  render() {
    const Icons = {
      AntDesign: { component: AntDesign, names: ['book', 'barschart'] },
      Entypo: { component: Entypo, names: ['arrow-left'] },
      EvilIcons: { component: EvilIcons, names: ['arrow-left'] },
      Feather: { component: Feather, names: ['hash', 'headphones'] },
      FontAwesome: { component: FontAwesome, names: ['arrow-left'] },
      FontAwesome5: { component: FontAwesome5, names: ['arrow-left'] },
      Foundation: { component: Foundation, names: ['arrow-left'] },
      Ionicons: { component: Ionicons, names: ['md-heart'] },
      MaterialCommunityIcons: { component: MaterialCommunityIcons, names: ['arrow-left'] },
      MaterialIcons: { component: MaterialIcons, names: ['explicit'] },
      Octicons: { component: Octicons, names: ['arrow-left'] },
      SimpleLineIcons: { component: SimpleLineIcons, names: ['arrow-left'] },
      Zocial: { component: Zocial, names: ['youtube', 'twitter'] },
    };
    return (
      <View>
        {Object.keys(Font.FontDisplay).map(key => (
          <Text key={key} style={[styles.exampleText, { fontFamily: `comic-${key}` }]}>
            Example Text {key}
          </Text>
        ))}

        {Object.keys(Icons).map(key => {
          const { component: Icon, names } = Icons[key];
          return (
            <View style={{ flexDirection: 'row' }}>
              {names.map(name => {
                return <Icon name={name} size={16} color="blue" />;
              })}
            </View>
          );
        })}
        {this.state.loadedWithoutError && <Text>Loaded without error!</Text>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  exampleText: {
    fontSize: 16,
  },
});
