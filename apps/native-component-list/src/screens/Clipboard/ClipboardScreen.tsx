import * as Clipboard from 'expo-clipboard';
import { StringContentType } from 'expo-clipboard/build/Clipboard.types';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';

import FunctionDemo, { FunctionDescription } from '../../components/FunctionDemo';
import { ActionFunction, Platform } from '../../components/FunctionDemo/index.types';
import { isCurrentPlatformSupported } from '../../components/FunctionDemo/utils';
import ClipboardListenerDemo from './ClipboardListenerDemo';
import ImagePreview from './ImagePreview';

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
      action: withSupportedPlatforms(['android', 'ios'], Clipboard.hasImageAsync),
    },
    {
      name: 'hasUrlAsync',
      action: withSupportedPlatforms(['ios'], Clipboard.hasImageAsync),
    },
  ],
};

const SET_STRIING_ASYNC_CONFIG: FunctionDescription = {
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
          name: 'inputType',
          type: 'enum',
          platforms: ['ios', 'android'],
          values: [
            { name: 'StringContentType.PLAIN_TEXT', value: StringContentType.PLAIN_TEXT },
            { name: 'StringContentType.HTML', value: StringContentType.HTML },
          ],
        },
      ],
    },
  ],
  actions: (value: string, options: { inputType: StringContentType }) =>
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
          name: 'preferredType',
          type: 'enum',
          platforms: ['ios', 'android'],
          values: [
            { name: 'StringContentType.PLAIN_TEXT', value: StringContentType.PLAIN_TEXT },
            { name: 'StringContentType.HTML', value: StringContentType.HTML },
          ],
        },
      ],
    },
  ],
  actions: async (options: { preferredType: StringContentType }) => {
    const result = await Clipboard.getStringAsync(options);
    return result.length > 0 ? result : '[nothing]';
  },
};

const SET_IMAGE_ASYNC_CONFIG: FunctionDescription = {
  name: 'setImageAsync',
  platforms: ['ios', 'android'],
  parameters: [
    {
      name: 'imageBase64Data',
      type: 'constant',
      value: '[selected from image picker]',
    },
  ],
  actions: async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
      });
      if (!result.cancelled && result.base64) {
        await Clipboard.setImageAsync(result.base64);
        return 'Image copied to clipboard';
      }
    } else {
      Alert.alert('Permission required!', 'You must allow accessing images in order to proceed.');
    }
    return 'Image not selected';
  },
};

const GET_IMAGE_ASYNC_CONFIG: FunctionDescription = {
  name: 'getImageAsync',
  platforms: ['ios', 'android'],
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
  platforms: ['android'],
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
  SET_STRIING_ASYNC_CONFIG,
  GET_STRING_ASYNC_CONFIG,
  SET_IMAGE_ASYNC_CONFIG,
  GET_IMAGE_ASYNC_CONFIG,
  SET_URL_ASYNC_CONFIG,
  GET_URL_ASYNC_CONFIG,
];

function ClipboardScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
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
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
});

export default ClipboardScreen;
