import React from 'react';
import { SectionList, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { H1, H2, H3, H4, H5, H6, A, Article } from '@expo/html-elements';

export default class HTMLScreen extends React.Component {
  static navigationOptions = {
    title: 'HTML',
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <H1>Header 1</H1>
        <H2>Header 2</H2>
        <H3>Header 3</H3>
        <H4>Header 4</H4>
        <H5>Header 5</H5>
        <H6>Header 6</H6>
        <Article>
          <A href="https://expo.io/" target="_blank">
            Anchor in Article
          </A>
        </Article>
      </View>
    );
  }
}
