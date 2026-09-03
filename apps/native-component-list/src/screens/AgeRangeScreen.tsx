import * as AgeRange from 'expo-age-range';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BodyText } from '../components/BodyText';
import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

const FAKE_SIGNALS: Record<string, AgeRange.FakeAgeSignals> = {
  'supervised 13 to 15 year old': {
    ageSignalsStatus: 'SHARED',
    lowerBound: 13,
    upperBound: 15,
    ageRangeSource: 'TIER_B',
    significantChangeStatus: 'PENDING',
  },
  adult: {
    ageSignalsStatus: 'SHARED',
    lowerBound: 18,
    ageRangeSource: 'TIER_D',
  },
  'signals not shared': {
    ageSignalsStatus: 'NOT_SHARED',
  },
  // -4 is PLAY_SERVICES_NOT_FOUND. See
  // https://developer.android.com/google/play/age-signals/handle-errors
  'error code -4': {
    errorCode: -4,
  },
};

export default function AgeRangeScreen() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestAgeSignalsAccess = async () => {
    setError(null);
    setResult(null);

    try {
      // Android shows Play Age Signals' in-app consent screen here. On iOS the consent prompt is
      // part of requestAgeRangeAsync, so there is nothing separate to call and this resolves null.
      const status = await AgeRange.requestAgeSignalsAccessAsync();
      setResult(
        status === null
          ? 'null (unsupported on this platform, or no status reported)'
          : `ageSignalsStatus: ${status}`
      );
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  const requestAgeRange = async () => {
    setError(null);
    setResult(null);

    try {
      // Request age range with thresholds at 13, 16, and 18 years
      // These are common age gates for content restrictions
      const response = await AgeRange.requestAgeRangeAsync({
        threshold1: 13,
        threshold2: 16,
        threshold3: 18,
      });

      setResult(JSON.stringify(response, null, 2));
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  const checkEligibility = async () => {
    setError(null);
    setResult(null);

    try {
      const eligible = await AgeRange.isEligibleForAgeFeaturesAsync();
      setResult(
        eligible === null
          ? 'null (unsupported on this OS / platform)'
          : `isEligibleForAgeFeatures: ${eligible}`
      );
    } catch (err: any) {
      if (err?.code === 'ERR_AGE_RANGE_NOT_AVAILABLE') {
        setResult('ERR_AGE_RANGE_NOT_AVAILABLE');
        return;
      }
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  const showSignificantUpdate = async () => {
    setError(null);
    setResult(null);

    try {
      await AgeRange.showSignificantUpdateAcknowledgmentAsync(
        'This is a developer-specified message.'
      );
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  const getRequiredRegulatoryFeatures = async () => {
    setError(null);
    setResult(null);

    try {
      const features = await AgeRange.getRequiredRegulatoryFeaturesAsync();
      setResult(
        features === null
          ? 'null (unsupported on this OS / platform)'
          : `Required regulatory features: ${JSON.stringify(features, null, 2)}`
      );
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  const faultyRequestAgeRange = async () => {
    setError(null);
    setResult(null);

    try {
      // interval too narrow
      const response = await AgeRange.requestAgeRangeAsync({
        threshold1: 10,
        threshold2: 11,
      });

      setResult(JSON.stringify(response, null, 2));
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  const applyFakeSignals = (name: string | null) => {
    setError(null);
    setResult(null);

    try {
      AgeRange.setFakeAgeSignals(name === null ? null : FAKE_SIGNALS[name]);
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <HeadingText style={styles.heading}>Age Range API</HeadingText>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Result:</Text>
          <MonoText containerStyle={styles.resultText}>{result}</MonoText>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorLabel}>Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <BodyText color="secondary" style={styles.description}>
        Request the user's age range with directly configurable (iOS) thresholds. This example uses
        thresholds at 13, 16, and 18 years old.
      </BodyText>

      <BodyText color="secondary" style={styles.description}>
        On Android, request age signals access first and continue only when the status is SHARED.
        Play reports every field as null until then. The age range result below reports
        ageRangeSource, significantChangeStatus and significantChangeApprovalDate on Android, and
        ageRangeDeclaration on iOS.
      </BodyText>

      <Button
        onPress={requestAgeSignalsAccess}
        title="Request Age Signals Access (Android)"
        style={styles.button}
      />
      <Button
        onPress={checkEligibility}
        title="Check Age Features Eligibility (iOS 26.2+)"
        style={styles.button}
      />
      <Button onPress={requestAgeRange} title="Request Age Range" style={styles.button} />
      <Button
        onPress={showSignificantUpdate}
        title="Show Significant Update Acknowledgment (iOS 26.4+)"
        style={styles.button}
      />
      <Button
        onPress={getRequiredRegulatoryFeatures}
        title="Get Required Regulatory Features (iOS 26.4+)"
        style={styles.button}
      />
      <Button
        onPress={faultyRequestAgeRange}
        title="Request Faulty Age Range"
        style={styles.button}
      />

      <HeadingText style={styles.heading}>Fake age signals (Android)</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        Play only reports age signals to accounts it has enabled, so pick a fake below to test the
        buttons above against another age range. The requests do not change, only what they report.
      </BodyText>

      {Object.keys(FAKE_SIGNALS).map((name) => (
        <Button
          key={name}
          onPress={() => applyFakeSignals(name)}
          title={`Fake ${name}`}
          style={styles.button}
        />
      ))}
      <Button
        onPress={() => applyFakeSignals(null)}
        title="Report the real age signals"
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  heading: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  warning: {
    fontSize: 13,
    color: '#ff9500',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  button: {
    marginBottom: 20,
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.tintColor,
  },
  resultText: {
    fontSize: 12,
    borderWidth: 0,
  },
  errorContainer: {
    backgroundColor: '#ffe8e8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#cc0000',
  },
  errorText: {
    fontSize: 14,
    color: '#cc0000',
  },
});
