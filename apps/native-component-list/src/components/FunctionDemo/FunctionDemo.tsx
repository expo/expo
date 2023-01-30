import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import HeadingText from '../HeadingText';
import MonoTextWithCountdown from '../MonoTextWithCountdown';
import ActionButton from './ActionButton';
import Configurator from './Configurator';
import Divider from './Divider';
import FunctionSignature, { generateFunctionSignature } from './FunctionSignature';
import Platforms from './Platforms';
import {
  ActionFunction,
  ArgumentName,
  ConstantParameter,
  FunctionArgument,
  FunctionParameter,
  OnArgumentChangeCallback,
  Platform,
  PrimitiveArgument,
  PrimitiveParameter,
} from './index.types';
import { isCurrentPlatformSupported } from './utils';

const STRING_TRIM_THRESHOLD = 300;

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
   * Supported platforms. Used in signature rendering and to grey-out unavailable functions.
   */
  platforms?: Platform[];
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
  renderAdditionalResult?: (result: any) => JSX.Element | void;
};

/**
 * Helper type for typing out the function description that is later passed to the `FunctionDemo` component.
 */
export type FunctionDescription = Omit<Props, 'namespace'>;

type Result =
  | {
      type: 'none';
    }
  | {
      type: 'error';
      error: unknown;
    }
  | {
      type: 'success';
      result: unknown;
    };

/**
 * FunctionDemo is a component that allows visualizing the function call.
 * It also allows the function's arguments manipulation and invoking the the function via the actions prop.
 * Additionally it presents the result of the successful function call.
 *
 * @example
 * ```tsx
 * const FUNCTION_DESCRIPTION: FunctionDescription = {
 *   name: 'functionName',
 *   parameters: [
 *     { name: 'param1', type: 'string', values: ['value1', 'value2'] },
 *     ...
 *   ],
 *   additionalParameters: [
 *     { name: 'additionalParameter', type: 'boolean', initial: false },
 *     ...
 *   ]
 *   actions: [
 *     {
 *       name: 'actionName',
 *       action: async (param1: string, ..., additionalParameter: boolean, ...) => {
 *         ...
 *         return someObject
 *       }
 *     },
 *     ...
 *   ]
 * }
 *
 * function DemoComponent() {
 *   return (
 *     <FunctionDemo namespace="ModuleName" {...FUNCTION_DESCRIPTION} />
 *   )
 * }
 * ```
 */
export default function FunctionDemo({ name, platforms = [], ...contentProps }: Props) {
  const disabled = !isCurrentPlatformSupported(platforms);

  return (
    <View style={disabled && styles.demoContainerDisabled}>
      <Platforms
        platforms={platforms}
        style={styles.platformBadge}
        textStyle={styles.platformText}
      />
      <HeadingText style={disabled && styles.headerDisabled}>{name}</HeadingText>
      {!disabled && <FunctionDemoContent name={name} {...contentProps} />}
    </View>
  );
}

function FunctionDemoContent({
  namespace,
  name,
  parameters = [],
  actions,
  renderAdditionalResult,
  additionalParameters = [],
}: Props) {
  const [result, setResult] = useState<Result>({ type: 'none' });
  const [args, updateArgument] = useArguments(parameters);
  const [additionalArgs, updateAdditionalArgs] = useArguments(additionalParameters);
  const actionsList = useMemo(
    () => (Array.isArray(actions) ? actions : [{ name: 'RUN ▶️', action: actions }]),
    [actions]
  );

  const handlePress = useCallback(
    async (action: ActionFunction) => {
      // force clear the previous result if exists
      setResult({ type: 'none' });
      try {
        const newResult = await action(...args, ...additionalArgs);
        setResult({ type: 'success', result: newResult });
      } catch (e) {
        logError(e, generateFunctionSignature({ namespace, name, parameters, args }));
        setResult({ type: 'error', error: e });
      }
    },
    [args, additionalArgs]
  );

  return (
    <>
      <Configurator parameters={parameters} onChange={updateArgument} value={args} />
      {additionalParameters.length > 0 && (
        <>
          <Divider text="ADDITIONAL PARAMETERS" />
          <Configurator
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
      {result.type === 'success' ? (
        <>
          <MonoTextWithCountdown onCountdownEnded={() => setResult({ type: 'none' })}>
            {resultToString(result.result)}
          </MonoTextWithCountdown>
          {renderAdditionalResult?.(result.result)}
        </>
      ) : result.type === 'error' ? (
        <MonoTextWithCountdown
          style={styles.errorResult}
          onCountdownEnded={() => setResult({ type: 'none' })}>
          {errorToString(result.error)}
        </MonoTextWithCountdown>
      ) : null}
    </>
  );
}

function logError(e: unknown, functionSignature: string) {
  console.error(`
${e}

Function call that failed:

  ${functionSignature.replace(/\n/g, '\n  ')}

  `);
}

function initialArgumentFromParameter(parameter: PrimitiveParameter | ConstantParameter) {
  switch (parameter.type) {
    case 'boolean':
      return parameter.initial;
    case 'string':
    case 'number':
      return parameter.values[0];
    case 'enum':
      return parameter.values[0].value;
    case 'constant':
      return parameter.value;
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
 * Initial value is constructed based on the description of each parameter.
 */
export function useArguments(
  parameters: FunctionParameter[]
): [FunctionArgument[], OnArgumentChangeCallback] {
  const [args, setArgs] = useState(initialArgumentsFromParameters(parameters));
  const updateArgument = useCallback(
    (name: ArgumentName, newValue: PrimitiveArgument) => {
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

function resultToString(result: unknown) {
  if (result === null) {
    return 'null';
  }

  if (result === 'undefined') {
    return 'undefined';
  }

  if (typeof result === 'object') {
    const trimmedResult = Object.fromEntries(
      Object.entries(result).map(([key, value]) => [
        key,
        typeof value === 'string' && value.length > STRING_TRIM_THRESHOLD
          ? `${value.substring(0, STRING_TRIM_THRESHOLD)}...`
          : value,
      ])
    );

    return JSON.stringify(trimmedResult, null, 2);
  }

  return String(result).length > STRING_TRIM_THRESHOLD
    ? `${String(result).substring(0, STRING_TRIM_THRESHOLD)}...`
    : String(result);
}

function errorToString(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingBottom: 20,
  },
  buttonsContainer: {
    position: 'absolute',
    right: 0,
    bottom: 3,
    flexDirection: 'row',
  },
  platformBadge: {
    position: 'absolute',
    top: 5,
  },
  platformText: {
    fontSize: 10,
  },
  headerDisabled: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  demoContainerDisabled: {
    marginBottom: 10,
  },
  errorResult: {
    borderColor: 'red',
  },
});
