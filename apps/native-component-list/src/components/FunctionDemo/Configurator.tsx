import React from 'react';
import { StyleSheet, View } from 'react-native';

import ConfiguratorChoice from './ConfiguratorChoice';
import {
  FunctionArgument,
  FunctionParameter,
  OnArgumentChangeCallback,
  PrimitiveArgument,
} from './index.types';

type Props = {
  parameters: FunctionParameter[];
  value: FunctionArgument[];
  onChange: OnArgumentChangeCallback;
};

export default function Configurator({ parameters, value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {parameters.map((parameter, index) =>
        parameter.type === 'constant' ? null : parameter.type === 'object' ? (
          parameter.properties.map(({ name, ...properties }) => (
            <ConfiguratorChoice
              {...properties}
              name={[parameter.name, name]}
              key={`${parameter.name}.${name}`}
              value={(value[index] as Record<string, PrimitiveArgument>)[name]}
              onChange={onChange}
            />
          ))
        ) : (
          <ConfiguratorChoice
            {...parameter}
            key={parameter.name}
            value={value[index] as PrimitiveArgument}
            onChange={onChange}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
  },
});
