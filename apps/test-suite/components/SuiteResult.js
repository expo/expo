import React from 'react';
import { View, Text } from 'react-native';
import SpecResult from './SpecResult';

export default class SuiteResult extends React.Component {
  _renderSpecResult = r => {
    const status = r.get('status');
    const key = r.get('id');
    const description = r.get('description');
    const failedExpectations = r.get('failedExpectations');

    return (
      <SpecResult
        key={key}
        status={status}
        description={description}
        failedExpectations={failedExpectations}
      />
    );
  };

  render() {
    const { r, depth } = this.props;
    const result = r.get('result');
    const description = result.get('description');
    const specs = r.get('specs');
    const children = r.get('children');

    const titleStyle =
      depth === 0
        ? { marginBottom: 8, fontSize: 16, fontWeight: 'bold' }
        : { marginVertical: 8, fontSize: 16 };
    const containerStyle =
      depth === 0
        ? {
            paddingLeft: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: '#ddd',
          }
        : { paddingLeft: 16 };

    // console.log('Result', result);
    return (
      <View style={containerStyle}>
        <Text style={titleStyle}>{description}</Text>
        {specs.map(this._renderSpecResult)}
        {children.map(r => (
          <SuiteResult key={r.get('result').get('id')} r={r} depth={depth + 1} />
        ))}
      </View>
    );
  }
}
