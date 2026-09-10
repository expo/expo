package expo.modules.imagepicker.contracts

/**
 * Outcome of mapping a crop activity result before EXIF copy / success handling.
 *
 * [CROP_IMAGE_PARSE_CANCELLED_CODE] matches `Activity.RESULT_CANCELED`.
 * [CROP_IMAGE_PARSE_ERROR_CODE] matches `CropImage.CROP_IMAGE_ACTIVITY_RESULT_ERROR_CODE`.
 */
internal enum class CropImageParseKind {
  CANCELLED,
  ERROR,
  SUCCESS
}

internal const val CROP_IMAGE_PARSE_CANCELLED_CODE = 0
internal const val CROP_IMAGE_PARSE_ERROR_CODE = 204

/**
 * Maps a crop activity result to cancellation or error. [CropImageParseKind.SUCCESS] means
 * cropping succeeded and a non-null output URI is present.
 *
 * @see https://github.com/expo/expo/issues/49802
 */
internal fun mapCropImageParseKind(
  resultCode: Int,
  resultIsPresent: Boolean,
  uriContentIsNull: Boolean,
  hasError: Boolean,
  cancelledCode: Int = CROP_IMAGE_PARSE_CANCELLED_CODE,
  errorCode: Int = CROP_IMAGE_PARSE_ERROR_CODE
): CropImageParseKind {
  if (resultCode == cancelledCode || !resultIsPresent) {
    return CropImageParseKind.CANCELLED
  }
  // The crop activity reports a failure with an error result. Map it to an error the module can
  // reject with, instead of throwing on a null output URI.
  if (resultCode == errorCode || hasError || uriContentIsNull) {
    return CropImageParseKind.ERROR
  }
  return CropImageParseKind.SUCCESS
}
