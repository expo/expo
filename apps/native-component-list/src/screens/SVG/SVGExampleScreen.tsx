import { type NativeStackScreenProps } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import examples from './examples';

type Links = { SVGExample: { exampleKey?: string } };

type Props = NativeStackScreenProps<Links, 'SVGExample'>;

export default function SVGExampleScreen(props: Props) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: props.route.params.exampleKey ?? 'An SVG Example',
    });
  }, [props.navigation, props.route]);

  const renderSample = (Sample: React.ComponentType & { title: string }, index: number) => (
    <View style={styles.example} key={`sample-${index}`}>
      <Text style={styles.sampleTitle}>{Sample.title}</Text>
      <Sample />
    </View>
  );

  const renderNoExample = React.useCallback(() => <Text>No example found.</Text>, []);

  const renderContent = () => {
    const { exampleKey } = props.route.params;
    const example = exampleKey && examples[exampleKey];
    if (!example) {
      return renderNoExample();
    }
    const { samples } = example;
    return samples.map(renderSample);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
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
