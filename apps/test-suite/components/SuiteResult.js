import React from 'react';
import { View, Text } from 'react-native';
import SpecResult from './SpecResult';

export default class SuiteResult extends React.Component {
  _renderSpecResult = r => {
    const status = r.get('status') || 'running';
    const id = r.get('id');
    const description = r.get('description');
    const failedExpectations = r.get('failedExpectations');

    return (
      <SpecResult
        key={id}
        id={id}
        status={status}
        description={description}
        failedExpectations={failedExpectations}
      />
    );
  };

  render() {
    const { depth, id, description, specs, children } = this.props;

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

    return (
      <View key={id} style={containerStyle}>
        <Text style={titleStyle}>{description}</Text>
        {specs.map(this._renderSpecResult)}
        {children.map(r => {
          const result = r.get('result');
          const id = result.get('id');
          const description = result.get('description');
          const specs = r.get('specs');
          const children = r.get('children');

          return (
            <SuiteResult
              id={id}
              description={description}
              specs={specs}
              children={children}
              depth={depth + 1}
            />
          );
        })}
      </View>
    );
  }
}
