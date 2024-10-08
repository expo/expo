// @hidden
import { ImagePickerOptions, MediaType, MediaTypeOptions } from './ImagePicker.types';

export function parseMediaTypes(
  mediaTypes: MediaTypeOptions | MediaType | MediaType[]
): MediaType[] {
  const mediaTypeOptionsToMediaType: Record<MediaTypeOptions, MediaType[]> = {
    Images: ['images'],
    Videos: ['videos'],
    All: ['images', 'videos'],
  };

  if (
    mediaTypes === MediaTypeOptions.Images ||
    mediaTypes === MediaTypeOptions.Videos ||
    mediaTypes === MediaTypeOptions.All
  ) {
    console.warn(
      '[expo-image-picker] `ImagePicker.MediaTypeOptions` have been deprecated. Use `ImagePicker.MediaType` or an array of `ImagePicker.MediaType` instead.'
    );
    return mediaTypeOptionsToMediaType[mediaTypes];
  }
  // Unlike iOS, Android can't auto-cast to array
  if (typeof mediaTypes === 'string') {
    return [mediaTypes];
  }
  return mediaTypes;
}

// We deprecated the MediaTypeOptions in SDK52, we should remove it in future release.
export function mapDeprecatedOptions(options: ImagePickerOptions) {
  if (!options.mediaTypes) {
    return options;
  }
  return { ...options, mediaTypes: parseMediaTypes(options.mediaTypes ?? []) };
}
