import { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

import Configurator from '../../components/Configurator';
import DisappearingMonoText from '../../components/DisappearingMonoText';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import { Colors } from '../../constants';

type Parameter = {
  name: string;
  type: string;
  initial: any;
  title: string;
};

type Props = {
  name: string;
  params?: Parameter[];
  action: (...args: any[]) => Promise<object>;
  headingGenerator?: (methodName: string) => string;
  methodSignatureGenerator?: (methodName: string, args: Record<string, any>) => string;
};

export default function PermissionMethodDemo({
  headingGenerator = (methodName) => methodName,
  methodSignatureGenerator = (methodName) => `${methodName}()`,
  name,
  params = [],
  action,
}: Props) {
  const [result, setResult] = useState<object | undefined>(undefined);
  const [args, setArgs] = useState(
    Object.fromEntries(params.map((param) => [param.name, param.initial]))
  );

  const handlePress = useCallback(async () => {
    const r = await action();
    setResult(r);
  }, []);

  return (
    <>
      <HeadingText>{headingGenerator(name)}</HeadingText>
      <Configurator choices={params} onChange={setArgs} />
      <View style={styles.container}>
        <MonoText>{methodSignatureGenerator(name, args)}</MonoText>
        <View style={styles.button}>
          <TouchableOpacity onPress={handlePress}>
            <Text style={styles.buttonText}>RUN ▶️</Text>
          </TouchableOpacity>
        </View>
      </View>
      {result && (
        <DisappearingMonoText onDisappear={() => setResult(undefined)}>
          {JSON.stringify(result, null, 2)}
        </DisappearingMonoText>
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
