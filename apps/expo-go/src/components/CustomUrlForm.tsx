import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';

import { isValidExpoUrl, loadExpoUrl } from '../utils/urlLoader';

const CustomUrlForm = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setError('');
    if (!isValidExpoUrl(url)) {
      setError('Invalid Expo URL. It should start with exp://');
      return;
    }

    setLoading(true);
    try {
      await loadExpoUrl(url);
    } catch (e: any) {
      setError(`Failed to load bundle: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Enter Expo URL"
        value={url}
        onChangeText={setUrl}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 6,
        }}
      />
      <Button title="Load Bundle" onPress={handleLoad} />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
      {!!error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
    </View>
  );
};

export default CustomUrlForm;
