import { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

import { Colors } from '../constants';
import DisappearingMonoText from './DisappearingMonoText';
import FunctionConfigurator from './FunctionConfigurator';
import {
  FunctionArgument,
  FunctionParameter,
  PrimitiveArgument,
  PrimitiveParameter,
} from './FunctionDemo.types';
import HeadingText from './HeadingText';
import MonoText from './MonoText';

function FunctionSignature({
  namespace,
  name,
  parameters,
  args,
}: {
  namespace: string;
  name: string;
  parameters: FunctionParameter[];
  args: FunctionArgument[];
}) {
  const renderArguments = () => {
    return parameters
      .map((parameter, idx) => {
        switch (parameter.type) {
          case 'object':
            // eslint-disable-next-line no-case-declarations
            const entries = Object.entries(args[idx])
              .map(([key, value]) => {
                const property = parameter.properties.find((property) => property.name === key);
                if (property?.type === 'enum') {
                  return `${key}: ${property.values.find((v) => v.value === value)?.name}`;
                }
                return `${key}: ${property?.type === 'string' ? `"${value}"` : value}`;
              })
              .join(',\n  ');

            return `{\n  ${entries}\n}`;

          case 'enum':
            return parameter.values.find(({ value }) => value === args[idx])!.name;
          default:
            return String(args[idx]);
        }
      })
      .join(', ');
  };

  return (
    <MonoText>
      {namespace}.{name}({renderArguments()})
    </MonoText>
  );
}

function initialArgumentFromParameter(parameter: PrimitiveParameter) {
  switch (parameter.type) {
    case 'boolean':
      return parameter.initial;
    case 'string':
    case 'number':
      return parameter.values[0];
    case 'enum':
      return parameter.values[0].value;
  }
}

function initialArgumentsFromParameters(parameters: FunctionParameter[]) {
  return parameters.map((parameter) => {
    switch (parameter.type) {
      case 'object':
        return Object.fromEntries(
          parameter.properties.map((property) => {
            return [property.name, initialArgumentFromParameter(property)];
          })
        );
      default:
        return initialArgumentFromParameter(parameter);
    }
  });
}

/**
 * Hook that handles function arguments' values.
 * Initial value is constructed based on the description of each
 */
function useArguments(
  parameters: FunctionParameter[]
): [FunctionArgument[], (name: string | [string, string], newValue: PrimitiveArgument) => void] {
  const [args, setArgs] = useState(initialArgumentsFromParameters(parameters));
  const updateArgument = useCallback(
    (name: string | [string, string], newValue: PrimitiveArgument) => {
      const parameterIsObject = typeof name === 'object';
      const argumentName = parameterIsObject ? name[0] : name;
      const argumentIdx = parameters.findIndex((parameter) => parameter.name === argumentName);
      setArgs((currentArgs) => {
        const newArgs = [...currentArgs];
        newArgs[argumentIdx] = parameterIsObject
          ? {
              ...(currentArgs[argumentIdx] as object),
              [name[1]]: newValue,
            }
          : newValue;
        return newArgs;
      });
    },
    [parameters]
  );
  return [args, updateArgument];
}

type Props = {
  namespace: string;
  name: string;
  parameters?: FunctionParameter[];
  action: (...args: any[]) => Promise<unknown>;
  renderAdditionalResult?: (result: unknown) => JSX.Element | void;
};

export type FunctionDescription = Pick<Props, 'name' | 'parameters' | 'action'>;

export default function FunctionDemo({
  namespace,
  name,
  parameters = [],
  action,
  renderAdditionalResult: renderResult,
}: Props) {
  const [result, setResult] = useState<unknown | undefined>(undefined);
  const [args, updateArgument] = useArguments(parameters);

  console.log(args);

  const handlePress = useCallback(async () => {
    const r = await action(...args);
    setResult(r);
  }, [args]);

  return (
    <>
      <HeadingText>{name}</HeadingText>
      <FunctionConfigurator parameters={parameters} onChange={updateArgument} value={args} />
      <View style={styles.container}>
        <FunctionSignature namespace={namespace} name={name} parameters={parameters} args={args} />
        <View style={styles.button}>
          <TouchableOpacity onPress={handlePress}>
            <Text style={styles.buttonText}>RUN ▶️</Text>
          </TouchableOpacity>
        </View>
      </View>
      {result && (
        <>
          {renderResult?.(result)}
          <DisappearingMonoText onDisappear={() => setResult(undefined)}>
            {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
          </DisappearingMonoText>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingBottom: 20,
  },

  button: {
    position: 'absolute',
    right: 0,
    bottom: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: Colors.tintColor,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 10,
    padding: 2,
    fontWeight: '500',
    color: 'white',
  },
});
