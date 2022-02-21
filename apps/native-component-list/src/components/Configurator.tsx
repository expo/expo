import Checkbox from 'expo-checkbox';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export type ConfiguratorChoiceType<ValueType = any> = {
  name: string;
  title: string;
  initial: ValueType;
  platforms?: string[];
  resolve?: (value: ValueType) => any;
};

type ConfiguratorChoiceProps<ValueType = any> = ConfiguratorChoiceType<ValueType> & {
  value: any;
  onChange: (name: string, value: any) => void;
};

type ConfiguratorProps<ValueType = Record<string, any>> = {
  choices: ConfiguratorChoiceType[];
  onChange?: (result: ValueType) => void;
};

function ConfiguratorChoice<ValueType = any>(props: ConfiguratorChoiceProps<ValueType>) {
  const { name, title, value, onChange, resolve } = props;
  const onChangeCallback = React.useCallback(
    (newValue) => {
      const resolvedValue = resolve ? resolve(newValue) : newValue;
      onChange(name, resolvedValue);
    },
    [name, onChange]
  );

  return (
    <View style={styles.choice}>
      <Checkbox style={styles.checkbox} onValueChange={onChangeCallback} value={value} />
      <Text>{title}</Text>
    </View>
  );
}

function initialValueFromChoices(choices: ConfiguratorChoiceType[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const choice of choices) {
    result[choice.name] = choice.resolve ? choice.resolve(choice.initial) : choice.initial;
  }
  return result;
}

export default function Configurator(props: ConfiguratorProps) {
  const { choices, onChange } = props;

  const supportedChoices = choices.filter((choice) => {
    return !choice.platforms || choice.platforms.includes(Platform.OS);
  });

  const initialValue = React.useMemo(() => initialValueFromChoices(supportedChoices), []);
  const [result, setResult] = React.useState(initialValue);
  const onChoiceChange = React.useCallback(
    (name, value) => {
      const newResult = { ...result, [name]: value };
      setResult(newResult);
    },
    [result]
  );

  // Broadcast value changes
  React.useEffect(() => onChange?.(result), [result]);

  return (
    <View style={styles.configurator}>
      {supportedChoices.map((choice) => (
        <ConfiguratorChoice
          {...choice}
          key={choice.name}
          value={result[choice.name]}
          onChange={onChoiceChange}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  configurator: {
    marginVertical: 7,
  },
  choice: {
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 5,
  },
});
