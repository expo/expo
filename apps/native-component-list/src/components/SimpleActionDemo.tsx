import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import MonoText from './MonoText';
import Colors from '../constants/Colors';

type SimpleActionDemoProps = {
  title: string;
  action: (setValue: (value: any) => any) => any;
};

const SimpleActionDemo = ({ action, title }: SimpleActionDemoProps) => {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<any>(undefined);

  const runAction = useCallback(async () => {
    setLoading(true);
    try {
      const value = await action(setValue);
      setValue(value);
    } catch (error) {
      console.error(error);
      setValue(error);
    }
    setLoading(false);
  }, [action]);

  const monoContainerStyle = value instanceof Error ? styles.demoMonoContainerError : {};

  return (
    <View style={styles.demoContainer}>
      <TouchableOpacity onPress={runAction}>
        <View style={styles.demoHeaderContainer}>
          <Text style={styles.demoHeader}>{title}</Text>
          {loading && <ActivityIndicator style={styles.demoActivityIndicator} size={10} />}
        </View>
      </TouchableOpacity>
      <View style={{ opacity: loading ? 0.4 : 1.0 }}>
        {value !== undefined && (
          <MonoText containerStyle={monoContainerStyle}>{JSON.stringify(value, null, 2)}</MonoText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  demoContainer: {
    paddingHorizontal: 10,
    borderColor: Colors.border,
    borderBottomWidth: 1.0 / PixelRatio.get(),
  },
  demoHeaderContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  demoHeader: {
    fontWeight: 'bold',
    color: Colors.tintColor,
  },
  demoActivityIndicator: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  demoMonoContainerError: {
    borderColor: Colors.errorBackground,
  },
});

export default SimpleActionDemo;
