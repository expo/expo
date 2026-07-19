import React from 'react';
import { StyleSheet, View } from 'react-native';

import ConfiguratorChoice from './ConfiguratorChoice';
import {
  ArgumentName,
  FunctionArgument,
  FunctionParameter,
  OnArgumentChangeCallback,
  PrimitiveArgument,
} from './index.types';

function renderConfiguratorChoice(
  parameter: FunctionParameter,
  value: FunctionArgument,
  onChange: OnArgumentChangeCallback,
  path: string[] = []
): React.ReactNode {
  if (parameter.type === 'constant') return null;

  const isObjectProperty = path.length > 0;

  const propertyValue = isObjectProperty
    ? (value as { [key: string]: FunctionArgument })[parameter.name]
    : value;

  const fullPath = [...path, parameter.name];

  if (parameter.type === 'object') {
    return parameter.properties.flatMap((property) =>
      renderConfiguratorChoice(property, propertyValue, onChange, fullPath)
    );
  }

  const [root, ...rest] = fullPath;

  const name: ArgumentName = isObjectProperty ? [root, rest.join('.')] : root;

  return (
    <ConfiguratorChoice
      {...parameter}
      name={name}
      key={fullPath.join('.')}
      value={propertyValue as PrimitiveArgument}
      onChange={onChange}
    />
  );
}

type Props = {
  parameters: FunctionParameter[];
  value: FunctionArgument[];
  onChange: OnArgumentChangeCallback;
};

export default function Configurator({ parameters, value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {parameters.flatMap((parameter, index) =>
        renderConfiguratorChoice(parameter, value[index], onChange)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
  },
});
