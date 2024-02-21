import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricsSecurityLevel } from 'expo-local-authentication';
import { Platform } from 'expo-modules-core';
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';

const enrolledLevelMap = {
  0: 'None',
  1: 'Passcode',
  2: 'Weak Biometric',
  3: 'Strong Biometric',
};

const securityLevels: BiometricsSecurityLevel[] = ['strong', 'weak'];

const LocalAuthenticationScreen = () => {
  const [waiting, setWaiting] = useState(false);
  const [supportedAuthenticationTypes, setSupportedAuthenticationTypes] = useState<
    string[] | undefined
  >();
  const [enrolledLevel, setEnrolledLevel] = useState<LocalAuthentication.SecurityLevel>(0);
  const [hasHardware, setHasHardware] = useState<boolean | undefined>();
  const [isEnrolled, setIsEnrolled] = useState<boolean | undefined>();
  const [securityLevelIndex, setSecurityLevelIndex] = useState(0);

  useEffect(() => {
    checkDevicePossibilities();
  }, []);

  const checkDevicePossibilities = async () => {
    const [hasHardware, isEnrolled, supportedAuthenticationTypes, enrolledLevel] =
      await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        getAuthenticationTypes(),
        LocalAuthentication.getEnrolledLevelAsync(),
      ]);
    setHasHardware(hasHardware);
    setIsEnrolled(isEnrolled);
    setSupportedAuthenticationTypes(supportedAuthenticationTypes);
    setEnrolledLevel(enrolledLevel);
  };

  const getAuthenticationTypes = async () => {
    return (await LocalAuthentication.supportedAuthenticationTypesAsync()).map(
      (type) => LocalAuthentication.AuthenticationType[type]
    );
  };

  const authenticate = async (withFallback: boolean = true) => {
    setWaiting(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate',
        cancelLabel: 'Cancel label',
        disableDeviceFallback: !withFallback,
        biometricsSecurityLevel: securityLevels[securityLevelIndex],
      });
      if (result.success) {
        alert('Authenticated!');
      } else {
        // @ts-ignore
        alert(`Failed to authenticate, reason: ${result.error}`);
      }
    } finally {
      setWaiting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.capabilitiesContainer}>
        <Text>Device capabilities:</Text>
        <MonoText textStyle={styles.monoText}>
          {JSON.stringify(
            {
              hasHardware,
              isEnrolled,
              supportedAuthenticationTypes,
              enrolledLevel: enrolledLevelMap[enrolledLevel as keyof typeof enrolledLevelMap],
            },
            null,
            2
          )}
        </MonoText>
      </View>
      <View>
        {waiting ? (
          <Text>Waiting for authentication...</Text>
        ) : (
          <View>
            {Platform.OS === 'android' && (
              <View style={styles.button}>
                <Text>Authentication security level</Text>
                <SegmentedControl
                  values={securityLevels}
                  selectedIndex={securityLevelIndex}
                  onValueChange={(value) => {
                    setSecurityLevelIndex(value === 'strong' ? 0 : 1);
                  }}
                />
              </View>
            )}
            <Button
              style={styles.button}
              onPress={() => authenticate(true)}
              title="Authenticate with device fallback"
            />
            <Button
              style={styles.button}
              onPress={() => authenticate(false)}
              title="Authenticate without device fallback"
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  capabilitiesContainer: {
    paddingBottom: 30,
  },
  monoText: {
    fontSize: 14,
  },
  button: {
    margin: 5,
  },
});

export default LocalAuthenticationScreen;
