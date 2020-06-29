import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import examples from './examples';

type Links = { SVGExample: { title?: string; key: string } };

type Props = StackScreenProps<Links, 'SVGExample'>;

export default class SVGExampleScreen extends React.Component<Props> {
  static navigationOptions = ({ route }: Props) => {
    return {
      title: route.params.title ?? 'An SVG Example',
    };
  };

  renderSample = (Sample: React.ComponentType & { title: string }, index: number) => (
    <View style={styles.example} key={`sample-${index}`}>
      <Text style={styles.sampleTitle}>{Sample.title}</Text>
      <Sample />
    </View>
  );

  renderNoExample = () => <Text>No example found.</Text>;

  renderContent = () => {
    const example = examples[this.props.route.params.key];
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
