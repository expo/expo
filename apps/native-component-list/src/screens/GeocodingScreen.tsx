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
import { NavigationEvents } from 'react-navigation';

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

interface State {
  selectedExample: ExampleType;
  result?: Location.Address[] | Location.GeocodedLocation[];
  inProgress: boolean;
  error?: any;
}

export default class GeocodingScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'Geocoding',
  };

  readonly state: State = {
    selectedExample: EXAMPLES[0],
    inProgress: false,
  };

  componentDidFocus() {
    Permissions.askAsync(Permissions.LOCATION);
  }

  render() {
    const { selectedExample } = this.state;

    return (
      <ScrollView style={styles.container}>
        <NavigationEvents onDidFocus={this.componentDidFocus} />
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Select a location</Text>
        </View>

        <View style={styles.examplesContainer}>{EXAMPLES.map(this._renderExample)}</View>

        <View style={styles.separator} />

        <View style={styles.actionContainer}>
          <Button
            onPress={this._attemptGeocodeAsync}
            title="Geocode"
            disabled={typeof selectedExample !== 'string'}
          />
          <Button
            onPress={this._attemptReverseGeocodeAsync}
            title="Reverse Geocode"
            disabled={typeof selectedExample !== 'object'}
          />
        </View>

        <View style={styles.separator} />

        {this._maybeRenderResult()}
      </ScrollView>
    );
  }

  _attemptReverseGeocodeAsync = async () => {
    this.setState({ inProgress: true });
    try {
      const result = await Location.reverseGeocodeAsync(
        this.state.selectedExample as {
          latitude: number;
          longitude: number;
        }
      );
      this.setState({ result });
    } catch (e) {
      this.setState({ error: e });
    } finally {
      this.setState({ inProgress: false });
    }
  };

  _attemptGeocodeAsync = async () => {
    this.setState({ inProgress: true, error: null });
    try {
      const result = await Location.geocodeAsync(this.state.selectedExample as string);
      this.setState({ result });
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ inProgress: false });
    }
  };

  _maybeRenderResult = () => {
    const { selectedExample } = this.state;
    if (!selectedExample) {
      return null;
    }
    const text =
      typeof selectedExample === 'string' ? selectedExample : JSON.stringify(selectedExample);

    if (this.state.inProgress) {
      return <ActivityIndicator style={{ marginTop: 10 }} />;
    } else if (this.state.result) {
      return (
        <View style={{ padding: 10 }}>
          <Text style={styles.resultText}>{text} resolves to</Text>
          <MonoText>{JSON.stringify(this.state.result, null, 2)}</MonoText>
        </View>
      );
    } else if (this.state.error) {
      return (
        <Text style={styles.errorResultText}>
          {text} cannot resolve: {JSON.stringify(this.state.error)}
        </Text>
      );
    }
    return null;
  };

  _renderExample = (example: ExampleType, i: number) => {
    const { selectedExample } = this.state;
    const isSelected = selectedExample === example;
    const text = typeof example === 'string' ? example : JSON.stringify(example);

    return (
      <Touchable
        key={i}
        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        onPress={() => this._selectExample(example)}>
        <Text style={[styles.exampleText, isSelected && styles.selectedExampleText]}>{text}</Text>
      </Touchable>
    );
  };

  _selectExample = (example: ExampleType) => {
    if (this.state.inProgress) {
      return;
    }

    this.setState({ selectedExample: example, result: undefined, error: undefined });
  };
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
