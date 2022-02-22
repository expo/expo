import { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

import { Colors } from '../constants';
import FunctionConfigurator from './FunctionConfigurator';
import {
  FunctionArgument,
  FunctionParameter,
  PrimitiveArgument,
  PrimitiveParameter,
} from './FunctionDemo.types';
import HeadingText from './HeadingText';
import MonoText from './MonoText';
import MonoTextWithCountdown from './MonoTextWithCountdown';

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
          case 'constant':
            return parameter.name;
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
      case 'constant':
        return parameter.value;
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

type ActionFunction = (...args: any[]) => Promise<unknown>;

type Props = {
  /**
   * Function namespace/scope (e.g. module name). Used in signature rendering.
   */
  namespace: string;
  /**
   * Function name. Used in signature rendering.
   */
  name: string;
  /**
   * Function-only parameters. Function's arguments are constructed based on these parameters and passed as-is to the actions callbacks.
   * These should reflect the actual function signature (type of arguments, default values, order, etc.).
   */
  parameters?: FunctionParameter[];
  /**
   * Additional parameters that are directly mappable to the function arguments.
   * If you need to add some additional logic to the function call you can do it here.
   * The current value for these parameters is passed to the actions' callbacks as the additional arguments.
   */
  additionalParameters?: PrimitiveParameter[];
  /**
   * Single action or a list of actions that could be called by the user. Each action would be fetched with the arguments constructed from the parameters.
   */
  actions: ActionFunction | { name: string; action: ActionFunction }[];
  /**
   * Rendering function to render some additional components based on the function's result.
   */
  renderAdditionalResult?: (result: unknown) => JSX.Element | void;
};

export type FunctionDescription = Pick<Props, 'name' | 'parameters' | 'actions'>;

/**
 * FunctionDemo is a component that allows to visualize the function call.
 * It allows the function's arguments manipulation and calling the function.
 * Additionally it present the result of the function call.
 */
export default function FunctionDemo({
  namespace,
  name,
  parameters = [],
  actions,
  renderAdditionalResult,
  additionalParameters = [],
}: Props) {
  const [result, setResult] = useState<unknown | undefined>(undefined);
  const [args, updateArgument] = useArguments(parameters);
  const [additionalArgs, updateAdditionalArgs] = useArguments(additionalParameters);

  const actionsList = Array.isArray(actions) ? actions : [{ name: 'RUN ▶️', action: actions }];

  const handlePress = useCallback(
    async (action: ActionFunction) => {
      const r = await action(...args, ...additionalArgs);
      setResult(r);
    },
    [args, additionalArgs]
  );

  return (
    <>
      <HeadingText>{name}</HeadingText>
      <FunctionConfigurator parameters={parameters} onChange={updateArgument} value={args} />
      {additionalParameters.length > 0 && (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ADDITIONAL PARAMETERS</Text>
            <View style={styles.dividerLine} />
          </View>
          <FunctionConfigurator
            parameters={additionalParameters}
            onChange={updateAdditionalArgs}
            value={additionalArgs}
          />
        </>
      )}
      <View style={styles.container}>
        <FunctionSignature namespace={namespace} name={name} parameters={parameters} args={args} />
        <View style={styles.buttonsContainer}>
          {actionsList.map(({ name, action }) => (
            <ActionButton key={name} name={name} action={action} onPress={handlePress} />
          ))}
        </View>
      </View>
      {result && (
        <>
          <MonoTextWithCountdown onCountdownEnded={() => setResult(undefined)}>
            {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
          </MonoTextWithCountdown>
          {renderAdditionalResult?.(result)}
        </>
      )}
    </>
  );
}

function ActionButton({
  name,
  action,
  onPress,
}: {
  name: string;
  action: ActionFunction;
  onPress: (action: ActionFunction) => void;
}) {
  const handlePress = useCallback(() => onPress(action), [onPress, action]);

  return (
    <View style={styles.button}>
      <TouchableOpacity onPress={handlePress}>
        <Text style={styles.buttonText}>{name}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingBottom: 20,
  },

  divider: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  dividerLine: {
    backgroundColor: 'black',
    height: 1,
    flex: 1,
  },

  dividerText: {
    paddingHorizontal: 5,
    fontSize: 8,
  },

  buttonsContainer: {
    position: 'absolute',
    right: 0,
    bottom: 3,
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginLeft: 5,
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
