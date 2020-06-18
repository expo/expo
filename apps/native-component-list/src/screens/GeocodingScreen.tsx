import { usePermissions } from '@use-expo/permissions';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import React from 'react';
import {
  ActivityIndicator,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Touchable from 'react-native-platform-touchable';

import MonoText from '../components/MonoText';

const EXAMPLES = [
  '1 Hacker Way, CA',
  { latitude: 49.28, longitude: -123.12 },
  'Palo Alto Caltrain Station (this one will error)',
  'Rogers Arena, Vancouver',
  { latitude: 0, longitude: 0 },
  ':-(',
];

type ArrayElementType<ArrayType> = ArrayType extends Array<infer ElementType> ? ElementType : never;
type ExampleType = ArrayElementType<typeof EXAMPLES>;

export default function GeocodingScreen() {
  const [selectedExample, setSelectedExample] = React.useState<ExampleType>(EXAMPLES[0]);
  const [inProgress, setInProgress] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<
    Location.Address[] | Location.GeocodedLocation[] | null
  >(null);
  const [error, setError] = React.useState<any>(null);

  const _attemptReverseGeocodeAsync = async () => {
    setInProgress(true);
    setError(null);
    try {
      const result = await Location.reverseGeocodeAsync(
        selectedExample as {
          latitude: number;
          longitude: number;
        }
      );
      setResult(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setInProgress(false);
    }
  };

  const _attemptGeocodeAsync = async () => {
    setInProgress(true);
    setError(null);
    try {
      const result = await Location.geocodeAsync(selectedExample as string);
      setResult(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setInProgress(false);
    }
  };

  const _maybeRenderResult = () => {
    if (!selectedExample) {
      return null;
    }
    const text =
      typeof selectedExample === 'string' ? selectedExample : JSON.stringify(selectedExample);

    if (inProgress) {
      return <ActivityIndicator style={{ marginTop: 10 }} />;
    } else if (result) {
      return (
        <View style={{ padding: 10 }}>
          <Text style={styles.resultText}>{text} resolves to</Text>
          <MonoText>{JSON.stringify(result, null, 2)}</MonoText>
        </View>
      );
    } else if (error) {
      return (
        <Text style={styles.errorResultText}>
          {text} cannot resolve: {JSON.stringify(error)}
        </Text>
      );
    }
    return null;
  };

  const _renderExample = (example: ExampleType, i: number) => {
    const isSelected = selectedExample === example;
    const text = typeof example === 'string' ? example : JSON.stringify(example);

    return (
      <Touchable
        key={i}
        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        onPress={() => _selectExample(example)}>
        <Text style={[styles.exampleText, isSelected && styles.selectedExampleText]}>{text}</Text>
      </Touchable>
    );
  };

  const _selectExample = (example: ExampleType) => {
    if (inProgress) {
      return;
    }

    setSelectedExample(example);
    setResult(null);
    setError(null);
  };

  const [permission] = usePermissions(Permissions.LOCATION, { ask: true });

  if (!permission) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Select a location</Text>
      </View>

      <View style={styles.examplesContainer}>{EXAMPLES.map(_renderExample)}</View>

      <View style={styles.separator} />

      <View style={styles.actionContainer}>
        <Button
          onPress={_attemptGeocodeAsync}
          title="Geocode"
          disabled={typeof selectedExample !== 'string'}
        />
        <Button
          onPress={_attemptReverseGeocodeAsync}
          title="Reverse Geocode"
          disabled={typeof selectedExample !== 'object'}
        />
      </View>

      <View style={styles.separator} />

      {_maybeRenderResult()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 10,
    marginBottom: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 20,
    marginBottom: 0,
    marginTop: 20,
  },
  exampleText: {
    fontSize: 15,
    color: '#ccc',
    marginVertical: 10,
  },
  examplesContainer: {
    paddingTop: 15,
    paddingBottom: 5,
    paddingHorizontal: 20,
  },
  selectedExampleText: {
    color: 'black',
  },
  resultText: {
    padding: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  errorResultText: {
    padding: 20,
    color: 'red',
  },
  button: {
    ...Platform.select({
      android: {
        marginBottom: 10,
      },
    }),
  },
});
