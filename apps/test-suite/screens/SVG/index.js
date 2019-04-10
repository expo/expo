import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function({ samples }) {
  return class App extends React.Component {
    renderSample = (Sample, index) => (
      <View key={`sample-${index}`} accessibilityLabel={`target-svg-${Sample.title}`}>
        <Sample />
      </View>
    );

    renderContent = () => {
      return samples.map(this.renderSample);
    };

    render() {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {this.renderContent()}
        </ScrollView>
      );
    }
  };
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
