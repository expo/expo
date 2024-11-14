import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import ImagePickerAssetsList from './ImagePickerAssetsList';
import FunctionDemo, {
  FunctionDescription,
  FunctionParameter,
} from '../../components/FunctionDemo';

const LAUNCH_PICKER_PARAMETERS: FunctionParameter[] = [
  {
    type: 'object',
    name: 'options',
    properties: [
      {
        name: 'mediaTypes',
        type: 'enum',
        values: [
          { name: "['images']", value: 'images' },
          { name: "['videos']", value: 'videos' },
          { name: "['livePhotos']", value: 'livePhotos' },
          { name: "['images', 'videos']", value: ['images', 'videos'] },
          { name: "['images', 'livePhotos']", value: ['images', 'livePhotos'] },
          { name: "['livePhotos', 'videos']", value: ['livePhotos', 'videos'] },
          { name: "['images', 'videos', 'livePhotos']", value: ['images', 'videos', 'livePhotos'] },
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
      { name: 'legacy', type: 'boolean', initial: false },
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
      {
        name: 'allowsMultipleSelection',
        type: 'boolean',
        initial: false,
      },
      {
        name: 'selectionLimit',
        type: 'number',
        values: [0, 1, 3],
        platforms: ['ios', 'android'],
      },
      {
        name: 'orderedSelection',
        type: 'boolean',
        initial: false,
        platforms: ['ios'],
      },
      { name: 'videoMaxDuration', type: 'number', values: [0, 10, 60] },
      {
        name: 'presentationStyle',
        type: 'enum',
        platforms: ['ios'],
        values: [
          {
            name: 'UIImagePickerPresentationStyle.FULL_SCREEN',
            value: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
          },
          {
            name: 'UIImagePickerPresentationStyle.PAGE_SHEET',
            value: ImagePicker.UIImagePickerPresentationStyle.PAGE_SHEET,
          },
          {
            name: 'UIImagePickerPresentationStyle.FORM_SHEET',
            value: ImagePicker.UIImagePickerPresentationStyle.FORM_SHEET,
          },
          {
            name: 'UIImagePickerPresentationStyle.CURRENT_CONTEXT',
            value: ImagePicker.UIImagePickerPresentationStyle.CURRENT_CONTEXT,
          },
          {
            name: 'UIImagePickerPresentationStyle.OVER_FULL_SCREEN',
            value: ImagePicker.UIImagePickerPresentationStyle.OVER_FULL_SCREEN,
          },
          {
            name: 'UIImagePickerPresentationStyle.OVER_CURRENT_CONTEXT',
            value: ImagePicker.UIImagePickerPresentationStyle.OVER_CURRENT_CONTEXT,
          },
          {
            name: 'UIImagePickerPresentationStyle.POPOVER',
            value: ImagePicker.UIImagePickerPresentationStyle.POPOVER,
          },
          {
            name: 'UIImagePickerPresentationStyle.AUTOMATIC',
            value: ImagePicker.UIImagePickerPresentationStyle.AUTOMATIC,
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

function ImagePickerScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {FUNCTIONS_DESCRIPTIONS.map((props, idx) => (
        <FunctionDemo
          key={idx}
          namespace="ImagePicker"
          {...props}
          renderAdditionalResult={ImagePickerAssetsList}
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
});

export default ImagePickerScreen;
