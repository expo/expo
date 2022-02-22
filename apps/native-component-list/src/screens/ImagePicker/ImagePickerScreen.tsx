import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import FunctionDemo, { FunctionDescription } from '../../components/FunctionDemo';
import { FunctionParameter } from '../../components/FunctionDemo.types';

const LAUNCH_PICKER_PARAMETERS: FunctionParameter[] = [
  {
    type: 'object',
    name: 'options',
    properties: [
      {
        name: 'mediaTypes',
        type: 'enum',
        values: [
          { name: 'MediaTypeOptions.Images', value: ImagePicker.MediaTypeOptions.Images },
          { name: 'MediaTypeOptions.Videos', value: ImagePicker.MediaTypeOptions.Videos },
          { name: 'MediaTypeOptions.All', value: ImagePicker.MediaTypeOptions.All },
        ],
      },
      { name: 'allowsEditing', type: 'boolean', initial: false },
      {
        name: 'aspect',
        type: 'enum',
        values: [
          { name: '[4, 3]', value: [4, 3] },
          { name: '[1, 1]', value: [1, 1] },
          { name: '[1, 2]', value: [1, 2] },
        ],
        platforms: ['android'],
      },
      { name: 'quality', type: 'number', values: [0, 0.2, 0.7, 1.0] },
      { name: 'exif', type: 'boolean', initial: false },
      { name: 'base64', type: 'boolean', initial: false },
      {
        name: 'videoExportPreset',
        type: 'enum',
        platforms: ['ios'],
        values: [
          {
            name: 'VideoExportPreset.Passthrough',
            value: ImagePicker.VideoExportPreset.Passthrough,
          },
          {
            name: 'VideoExportPreset.LowQuality',
            value: ImagePicker.VideoExportPreset.LowQuality,
          },
          {
            name: 'VideoExportPreset.MediumQuality',
            value: ImagePicker.VideoExportPreset.MediumQuality,
          },
          {
            name: 'VideoExportPreset.HighestQuality',
            value: ImagePicker.VideoExportPreset.HighestQuality,
          },
          {
            name: 'VideoExportPreset.H264_640x480',
            value: ImagePicker.VideoExportPreset.H264_640x480,
          },
          {
            name: 'VideoExportPreset.H264_960x540',
            value: ImagePicker.VideoExportPreset.H264_960x540,
          },
          {
            name: 'VideoExportPreset.H264_1280x720',
            value: ImagePicker.VideoExportPreset.H264_1280x720,
          },
          {
            name: 'VideoExportPreset.H264_1920x1080',
            value: ImagePicker.VideoExportPreset.H264_1920x1080,
          },
          {
            name: 'VideoExportPreset.H264_3840x2160',
            value: ImagePicker.VideoExportPreset.H264_3840x2160,
          },
          {
            name: 'VideoExportPreset.HEVC_1920x1080',
            value: ImagePicker.VideoExportPreset.HEVC_1920x1080,
          },
          {
            name: 'VideoExportPreset.HEVC_3840x2160',
            value: ImagePicker.VideoExportPreset.HEVC_3840x2160,
          },
        ],
      },
      {
        name: 'videoQuality',
        type: 'enum',
        platforms: ['ios'],
        values: [
          {
            name: 'UIImagePickerControllerQualityType.High',
            value: ImagePicker.UIImagePickerControllerQualityType.High,
          },
          {
            name: 'UIImagePickerControllerQualityType.Medium',
            value: ImagePicker.UIImagePickerControllerQualityType.Medium,
          },
          {
            name: 'UIImagePickerControllerQualityType.Low',
            value: ImagePicker.UIImagePickerControllerQualityType.Low,
          },
          {
            name: 'UIImagePickerControllerQualityType.VGA640x480',
            value: ImagePicker.UIImagePickerControllerQualityType.VGA640x480,
          },
          {
            name: 'UIImagePickerControllerQualityType.IFrame960x540',
            value: ImagePicker.UIImagePickerControllerQualityType.IFrame960x540,
          },
          {
            name: 'UIImagePickerControllerQualityType.IFrame1280x720',
            value: ImagePicker.UIImagePickerControllerQualityType.IFrame1280x720,
          },
        ],
      },
      { name: 'allowsMultipleSelection', type: 'boolean', initial: false, platforms: ['web'] },
      { name: 'videoMaxDuration', type: 'number', values: [0, 10, 60] },
      {
        name: 'presentationStyle',
        type: 'enum',
        platforms: ['ios'],
        values: [
          {
            name: 'UIImagePickerPresentationStyle.FullScreen',
            value: ImagePicker.UIImagePickerPresentationStyle.FullScreen,
          },
          {
            name: 'UIImagePickerPresentationStyle.PageSheet',
            value: ImagePicker.UIImagePickerPresentationStyle.PageSheet,
          },
          {
            name: 'UIImagePickerPresentationStyle.FormSheet',
            value: ImagePicker.UIImagePickerPresentationStyle.FormSheet,
          },
          {
            name: 'UIImagePickerPresentationStyle.CurrentContext',
            value: ImagePicker.UIImagePickerPresentationStyle.CurrentContext,
          },
          {
            name: 'UIImagePickerPresentationStyle.OverFullScreen',
            value: ImagePicker.UIImagePickerPresentationStyle.OverFullScreen,
          },
          {
            name: 'UIImagePickerPresentationStyle.OverCurrentContext',
            value: ImagePicker.UIImagePickerPresentationStyle.OverCurrentContext,
          },
          {
            name: 'UIImagePickerPresentationStyle.Popover',
            value: ImagePicker.UIImagePickerPresentationStyle.Popover,
          },
          {
            name: 'UIImagePickerPresentationStyle.BlurOverFullScreen',
            value: ImagePicker.UIImagePickerPresentationStyle.BlurOverFullScreen,
          },
          {
            name: 'UIImagePickerPresentationStyle.Automatic',
            value: ImagePicker.UIImagePickerPresentationStyle.Automatic,
          },
        ],
      },
    ],
  },
];

const FUNCTIONS_DESCRIPTIONS: FunctionDescription[] = [
  {
    name: 'requestMediaLibraryPermissionsAsync',
    parameters: [{ name: 'writeOnly', type: 'boolean', initial: false }],
    actions: (writeOnly: boolean) => ImagePicker.requestMediaLibraryPermissionsAsync(writeOnly),
  },
  {
    name: 'getMediaLibraryPermissionsAsync',
    parameters: [{ name: 'writeOnly', type: 'boolean', initial: false }],
    actions: (writeOnly: boolean) => ImagePicker.getMediaLibraryPermissionsAsync(writeOnly),
  },
  {
    name: 'requestCameraPermissionsAsync',
    actions: () => ImagePicker.requestCameraPermissionsAsync(),
  },
  {
    name: 'getCameraPermissionsAsync',
    actions: () => ImagePicker.getCameraPermissionsAsync(),
  },
  {
    name: 'launchImageLibraryAsync',
    parameters: LAUNCH_PICKER_PARAMETERS,
    actions: (options: ImagePicker.ImagePickerOptions) =>
      ImagePicker.launchImageLibraryAsync(options),
  },
  {
    name: 'launchCameraAsync',
    parameters: LAUNCH_PICKER_PARAMETERS,
    actions: (options: ImagePicker.ImagePickerOptions) => ImagePicker.launchCameraAsync(options),
  },
];

function isAnObjectWithUriAndType(obj: unknown): obj is { uri: string; type: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).uri === 'string' &&
    typeof (obj as any).type === 'string'
  );
}

function ImageOrVideo(result: unknown) {
  console.log(result);

  if (!isAnObjectWithUriAndType(result)) {
    return;
  }

  return (
    <View style={styles.previewContainer}>
      {result.type === 'video' ? (
        <Video
          source={{ uri: result.uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
        />
      ) : (
        <Image source={{ uri: result.uri }} style={styles.image} />
      )}
    </View>
  );
}

function ImagePickerScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {FUNCTIONS_DESCRIPTIONS.map((props, idx) => (
        <FunctionDemo
          key={idx}
          namespace="ImagePicker"
          {...props}
          renderAdditionalResult={ImageOrVideo}
        />
      ))}
    </ScrollView>
  );
}

ImagePickerScreen.navigationOptions = {
  title: 'ImagePicker',
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },
  video: {
    width: 300,
    height: 200,
  },
});

export default ImagePickerScreen;
