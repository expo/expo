import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Text, ScrollView, StyleSheet, Alert } from 'react-native';

import ClipboardListenerDemo from './ClipboardListenerDemo';
import ImagePreview from './ImagePreview';
import FunctionDemo, { FunctionDescription } from '../../components/FunctionDemo';
import { ActionFunction, Platform } from '../../components/FunctionDemo/index.types';
import { isCurrentPlatformSupported } from '../../components/FunctionDemo/utils';

const withSupportedPlatforms = (platforms: Platform[], action: ActionFunction): ActionFunction =>
  isCurrentPlatformSupported(platforms)
    ? action
    : () => Promise.resolve('Function is not supported on this platform');

const HAS_X_ASYNC_CONFIG: FunctionDescription = {
  name: 'hasXAsync',
  parameters: [],
  actions: [
    {
      name: 'hasStringAsync',
      action: Clipboard.hasStringAsync,
    },
    {
      name: 'hasImageAsync',
      action: Clipboard.hasImageAsync,
    },
    {
      name: 'hasUrlAsync',
      action: withSupportedPlatforms(['ios'], Clipboard.hasImageAsync),
    },
  ],
};

const SET_STRING_ASYNC_CONFIG: FunctionDescription = {
  name: 'setStringAsync',
  parameters: [
    {
      name: 'inputString',
      type: 'enum',
      values: [
        { name: '"Hello, world!"', value: 'Hello, world!' },
        { name: '"<p>HTML paragraph</p>"', value: '<p>HTML paragraph</p>' },
        { name: '"<ul><li>HTML list</li></ul>"', value: '<ul><li>HTML list</li></ul>' },
      ],
    },
    {
      name: 'options',
      type: 'object',
      properties: [
        {
          name: 'inputFormat',
          type: 'enum',
          values: [
            { name: 'StringFormat.PLAIN_TEXT', value: Clipboard.StringFormat.PLAIN_TEXT },
            { name: 'StringFormat.HTML', value: Clipboard.StringFormat.HTML },
          ],
        },
      ],
    },
  ],
  actions: (value: string, options: { inputFormat: Clipboard.StringFormat }) =>
    Clipboard.setStringAsync(value, options),
};

const GET_STRING_ASYNC_CONFIG: FunctionDescription = {
  name: 'getStringAsync',
  parameters: [
    {
      name: 'options',
      type: 'object',
      properties: [
        {
          name: 'preferredFormat',
          type: 'enum',
          values: [
            { name: 'StringFormat.PLAIN_TEXT', value: Clipboard.StringFormat.PLAIN_TEXT },
            { name: 'StringFormat.HTML', value: Clipboard.StringFormat.HTML },
          ],
        },
      ],
    },
  ],
  actions: async (options: { preferredFormat: Clipboard.StringFormat }) => {
    const result = await Clipboard.getStringAsync(options);
    return result.length > 0 ? result : '[nothing]';
  },
};

const SET_IMAGE_ASYNC_CONFIG: FunctionDescription = {
  name: 'setImageAsync',
  parameters: [
    {
      name: 'imageBase64Data',
      type: 'constant',
      value: '[selected from image picker]',
    },
    {
      name: 'quality',
      type: 'enum',
      values: [
        { name: 'RAW', value: 1.0 },
        { name: '0.5', value: 0.5 },
        { name: '0', value: 0 },
      ],
    },
  ],
  actions: async (_, quality) => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality,
      });
      if (!result.canceled) {
        const [asset] = result.assets;
        if (asset.base64) {
          await Clipboard.setImageAsync(asset.base64);
          return 'Image copied to clipboard';
        }
      }
    } else {
      Alert.alert('Permission required!', 'You must allow accessing images in order to proceed.');
    }
    return 'Image not selected';
  },
};

const GET_IMAGE_ASYNC_CONFIG: FunctionDescription = {
  name: 'getImageAsync',
  parameters: [
    {
      name: 'options',
      type: 'object',
      properties: [
        {
          name: 'format',
          type: 'enum',
          values: [
            { name: "'png'", value: 'png' },
            { name: "'jpeg'", value: 'jpeg' },
          ],
        },
        {
          name: 'jpegQuality',
          type: 'enum',
          values: [
            { name: '1', value: 1 },
            { name: '0.5', value: 0.5 },
            { name: '0', value: 0 },
          ],
        },
      ],
    },
  ],
  actions: Clipboard.getImageAsync,
};

const SET_URL_ASYNC_CONFIG: FunctionDescription = {
  name: 'setUrlAsync',
  platforms: ['ios'],
  parameters: [
    {
      name: 'url',
      type: 'constant',
      value: 'https://expo.dev',
    },
  ],
  actions: Clipboard.setUrlAsync,
};

const GET_URL_ASYNC_CONFIG: FunctionDescription = {
  name: 'getUrlAsync',
  platforms: ['ios'],
  parameters: [],
  actions: Clipboard.getUrlAsync,
};

const FUNCTIONS_DESCRIPTIONS = [
  HAS_X_ASYNC_CONFIG,
  SET_STRING_ASYNC_CONFIG,
  GET_STRING_ASYNC_CONFIG,
  SET_IMAGE_ASYNC_CONFIG,
  GET_IMAGE_ASYNC_CONFIG,
  SET_URL_ASYNC_CONFIG,
  GET_URL_ASYNC_CONFIG,
];

function ClipboardScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>
        Hint: Try copying/pasting between this screen and other apps: e.g. Web browser and Notes app
      </Text>
      {FUNCTIONS_DESCRIPTIONS.map((props, idx) => (
        <FunctionDemo
          key={idx}
          namespace="Clipboard"
          {...props}
          renderAdditionalResult={ImagePreview}
        />
      ))}
      <ClipboardListenerDemo />
    </ScrollView>
  );
}

ClipboardScreen.navigationOptions = {
  title: 'Clipboard',
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: 'center',
  },
});

export default ClipboardScreen;
