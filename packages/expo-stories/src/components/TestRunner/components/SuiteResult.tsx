import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import SpecResult from './SpecResult';

export default function SuiteResult({ r, depth }) {
  const renderSpecResult = React.useMemo(
    () => (r) => {
      const status = r.get('status');
      const key = r.get('id');
      const description = r.get('description');
      const failedExpectations = r.get('failedExpectations');

      return (
        <SpecResult
          key={`spec-result-${key}`}
          status={status}
          description={description}
          failedExpectations={failedExpectations}
        />
      );
    },
    []
  );

  const renderSuiteResult = React.useMemo(
    () => (r) => <SuiteResult key={r.get('result').get('id')} r={r} depth={depth + 1} />,
    [depth]
  );

  const result = r.get('result');
  const description = result.get('description');
  const specs = r.get('specs');
  const children = r.get('children');

  const titleStyle = depth === 0 ? styles.titleParent : styles.titleChild;
  const containerStyle = depth === 0 ? styles.containerParent : styles.containerChild;

  return (
    <View testID="test_suite_view_suite_container" style={containerStyle}>
      <Text testID="test_suite_text_suite_description" style={titleStyle}>
        {description}
      </Text>
      {specs.map(renderSpecResult)}
      {children.map(renderSuiteResult)}
    </View>
  );
}

const styles = StyleSheet.create({
  containerParent: {
    paddingLeft: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  containerChild: {
    paddingLeft: 16,
  },
  titleParent: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleChild: {
    marginVertical: 8,
    fontSize: 16,
  },
});
