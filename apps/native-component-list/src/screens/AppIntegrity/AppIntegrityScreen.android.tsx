import * as AppIntegrity from '@expo/app-integrity';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';

export default function AppIntegrityAndroidScreen() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hardwareAttestationSupported, setHardwareAttestationSupported] = useState<boolean | null>(
    null
  );
  const [lastGeneratedKeyAlias, setLastGeneratedKeyAlias] = useState<string>('');

  const addResult = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  useEffect(() => {
    const checkHardwareAttestationSupport = async () => {
      try {
        const supported = await AppIntegrity.isHardwareAttestationSupportedAsync();
        setHardwareAttestationSupported(supported);
        addResult(`Hardware attestation supported: ${supported}`);
      } catch (error) {
        setHardwareAttestationSupported(false);
        addResult(`Hardware attestation check error: ${error}`);
      }
    };

    checkHardwareAttestationSupport();
  }, []);

  const testPrepareIntegrityTokenProvider = async () => {
    setIsLoading(true);
    try {
      await AppIntegrity.prepareIntegrityTokenProviderAsync('1234567890');
      addResult('prepareIntegrityTokenProviderAsync: Success');
    } catch (error) {
      addResult(`prepareIntegrityTokenProviderAsync error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRequestIntegrityCheck = async () => {
    setIsLoading(true);
    try {
      const challenge = 'test-challenge-' + Date.now();
      const token = await AppIntegrity.requestIntegrityCheckAsync(challenge);
      addResult(`requestIntegrityCheckAsync: Success (token length: ${token.length})`);
    } catch (error) {
      addResult(`requestIntegrityCheckAsync error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullFlow = async () => {
    setIsLoading(true);
    try {
      await AppIntegrity.prepareIntegrityTokenProviderAsync('1234567890');
      addResult('prepareIntegrityTokenProviderAsync: Success');

      const challenge = 'test-challenge-' + Date.now();
      const token = await AppIntegrity.requestIntegrityCheckAsync(challenge);
      addResult(`requestIntegrityCheckAsync: Success (token length: ${token.length})`);
    } catch (error) {
      addResult(`Full flow error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGenerateHardwareAttestedKey = async () => {
    setIsLoading(true);
    try {
      const keyAlias = 'test_key';
      const challenge = 'hw_challenge';

      await AppIntegrity.generateHardwareAttestedKeyAsync(keyAlias, challenge);
      addResult(`generateHardwareAttestedKeyAsync: Success (alias: ${keyAlias})`);
      setLastGeneratedKeyAlias(keyAlias);
    } catch (error) {
      addResult(`generateHardwareAttestedKeyAsync error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetAttestationCertificateChain = async () => {
    setIsLoading(true);
    try {
      const keyAlias = lastGeneratedKeyAlias;
      if (!keyAlias) {
        addResult(`No key alias found. Please generate a key first.`);
        return;
      }
      const certificates = await AppIntegrity.getAttestationCertificateChainAsync(keyAlias);

      addResult(`getAttestationCertificateChain: Success`);
      addResult(`Certificate chain length: ${certificates.length}`);

      certificates.forEach((cert, index) => {
        const certPreview = cert.substring(0, 50) + '...';
        addResult(`Cert ${index}: ${certPreview}`);
      });
    } catch (error) {
      addResult(`getAttestationCertificateChain error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHardwareAttestationFullFlow = async () => {
    setIsLoading(true);
    try {
      const keyAlias = 'full_flow_key';
      const challenge = 'full_challenge';

      await AppIntegrity.generateHardwareAttestedKeyAsync(keyAlias, challenge);
      addResult(`✓ Generated hardware-attested key: ${keyAlias}`);

      const certificates = await AppIntegrity.getAttestationCertificateChainAsync(keyAlias);
      addResult(`✓ Retrieved certificate chain (${certificates.length} certificates)`);
      // console.log('certificates ', certificates);

      addResult(`Challenge used: ${challenge}`);
      addResult(`Certificate chain ready for server verification`);
      addResult(`--- Certificate Details ---`);

      certificates.forEach((cert, index) => {
        const certLength = cert.length;
        const certPreview = cert.substring(0, 64);
        addResult(`Cert ${index}: ${certLength} chars, starts with: ${certPreview}...`);
      });

      addResult(`✓ Hardware attestation flow completed successfully!`);
    } catch (error) {
      addResult(`Hardware attestation full flow error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>Android App Integrity Test</Text>
        <Text style={styles.subtitle}>Play Integrity API & Hardware Attestation</Text>
      </View>

      {/* Play Integrity API Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🛡️ Play Integrity API</Text>
        <Text style={styles.sectionSubtitle}>Requires Google Play Services</Text>
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.button}
            onPress={testPrepareIntegrityTokenProvider}
            disabled={isLoading}>
            <Text style={styles.buttonText}>Test prepareIntegrityTokenProviderAsync</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={testRequestIntegrityCheck} disabled={isLoading}>
            <Text style={styles.buttonText}>Test requestIntegrityCheckAsync</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={testFullFlow} disabled={isLoading}>
            <Text style={styles.buttonText}>Test Full Flow</Text>
          </Pressable>
        </View>
      </View>

      {/* Hardware Attestation Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🔒 Hardware Attestation</Text>
        <Text style={styles.sectionSubtitle}>
          Works on GrapheneOS & secure Android distributions
        </Text>
        <Text
          style={[
            styles.supportStatus,
            {
              color:
                hardwareAttestationSupported === true
                  ? '#34C759'
                  : hardwareAttestationSupported === false
                    ? '#FF3B30'
                    : '#666',
            },
          ]}>
          Support:{' '}
          {hardwareAttestationSupported === null
            ? 'Checking...'
            : hardwareAttestationSupported
              ? 'Available ✓'
              : 'Not Available ✗'}
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, !hardwareAttestationSupported && styles.disabledButton]}
            onPress={testGenerateHardwareAttestedKey}
            disabled={isLoading || !hardwareAttestationSupported}>
            <Text style={styles.buttonText}>Generate Hardware Key</Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              (!hardwareAttestationSupported || !lastGeneratedKeyAlias) && styles.disabledButton,
            ]}
            onPress={testGetAttestationCertificateChain}
            disabled={isLoading || !hardwareAttestationSupported || !lastGeneratedKeyAlias}>
            <Text style={styles.buttonText}>Get Certificate Chain</Text>
          </Pressable>

          <Pressable
            style={[styles.button, !hardwareAttestationSupported && styles.disabledButton]}
            onPress={testHardwareAttestationFullFlow}
            disabled={isLoading || !hardwareAttestationSupported}>
            <Text style={styles.buttonText}>Hardware Attestation Full Flow</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </Pressable>
      </View>

      <View style={styles.resultsContainer}>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Text style={styles.resultsTitle}>Results:</Text>
          {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
        </View>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
        {results.length === 0 && (
          <Text style={styles.noResults}>No results yet. Run a test to see output.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  platformWarning: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: -8,
  },
  supportStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: -4,
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
