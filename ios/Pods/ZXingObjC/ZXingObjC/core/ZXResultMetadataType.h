/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Represents some type of metadata about the result of the decoding that the decoder
 * wishes to communicate back to the caller.
 */
typedef enum {
  /**
   * Unspecified, application-specific metadata. Maps to an unspecified NSObject.
   */
  kResultMetadataTypeOther,

  /**
   * Denotes the likely approximate orientation of the barcode in the image. This value
   * is given as degrees rotated clockwise from the normal, upright orientation.
   * For example a 1D barcode which was found by reading top-to-bottom would be
   * said to have orientation "90". This key maps to an integer whose
   * value is in the range [0,360).
   */
  kResultMetadataTypeOrientation,

  /**
   * 2D barcode formats typically encode text, but allow for a sort of 'byte mode'
   * which is sometimes used to encode binary data. While ZXResult makes available
   * the complete raw bytes in the barcode for these formats, it does not offer the bytes
   * from the byte segments alone.
   *
   * This maps to an array of byte arrays corresponding to the
   * raw bytes in the byte segments in the barcode, in order.
   */
  kResultMetadataTypeByteSegments,

  /**
   * Error correction level used, if applicable. The value type depends on the
   * format, but is typically a String.
   */
  kResultMetadataTypeErrorCorrectionLevel,

  /**
   * For some periodicals, indicates the issue number as an integer.
   */
  kResultMetadataTypeIssueNumber,

  /**
   * For some products, indicates the suggested retail price in the barcode as a
   * formatted NSString.
   */
  kResultMetadataTypeSuggestedPrice,

  /**
   * For some products, the possible country of manufacture as NSString denoting the
   * ISO country code. Some map to multiple possible countries, like "US/CA".
   */
  kResultMetadataTypePossibleCountry,

  /**
   * For some products, the extension text
   */
  kResultMetadataTypeUPCEANExtension,

  /**
   * PDF417-specific metadata
   */
  kResultMetadataTypePDF417ExtraMetadata,

  /**
   * If the code format supports structured append and the current scanned code is part of one then the
   * sequence number is given with it.
   */
  kResultMetadataTypeStructuredAppendSequence,

  /**
   * If the code format supports structured append and the current scanned code is part of one then the
   * parity is given with it.
   */
  kResultMetadataTypeStructuredAppendParity
} ZXResultMetadataType;
