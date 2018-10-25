import React from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';

import * as examples from './examples';

export default class SVGExampleScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('title', 'An SVG Example'),
    };
  };

  renderSample = (Sample, index) => (
    <View style={styles.example} key={`sample-${index}`}>
      <Text style={styles.sampleTitle}>{Sample.title}</Text>
      <Sample />
    </View>
  );

  renderNoExample = () => <Text>No example found.</Text>;

  renderContent = () => {
    const example = examples[this.props.navigation.getParam('key')];
    if (!example) {
      return this.renderNoExample();
    }
    const { samples } = example;
    return samples.map(this.renderSample);
  };

  render() {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {this.renderContent()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  example: {
    paddingVertical: 25,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  sampleTitle: {
    marginHorizontal: 15,
    fontSize: 16,
    color: '#666',
  },
});
