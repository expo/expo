import React, { useState, useEffect } from 'react';
import { Pedometer } from 'expo-sensors';
import { Text, View } from 'react-native';

export default function App() {
  const [available, setAvailable] = useState('checking');
  const [pastStepCount, setPast] = useState(0);
  const [currentStepCount, setCurrent] = useState(0);

  useEffect(() => {
    subscribe();
  }, []);

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, []);

  const subscribe = async () => {
    this._subscription = Pedometer.watchStepCount(result => {
      setCount(result.steps);
    });

    Pedometer.isAvailableAsync().then(
      result => {
        setAvailable(String(result));
      },
      error => {
        setAvailable(`Could not get isPedometer Available: ${error}`);
      }
    );

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1);
    Pedometer.getStepCountAsync(start, end).then(
      result => {
        setPast(result.steps);
      },
      error => {
        setPast(`Could not get stepCount: ${error}`);
      }
    );
  };

  const unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  return (
    <View style={{ flex: 1, marginTop: 15, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Pedometer.isAvailableAsync(): {available}</Text>
      <Text>Steps taken in the last 24 hours: {pastStepCount}</Text>
      <Text>Walk! And watch this go up: {currentStepCount}</Text>
    </View>
  );
}
