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

#define ZXErrorDomain @"ZXErrorDomain"

enum {
  /**
   * Thrown when a barcode was successfully detected and decoded, but
   * was not returned because its checksum feature failed.
   */
  ZXChecksumError     = 1000,

  /**
   * Thrown when a barcode was successfully detected, but some aspect of
   * the content did not conform to the barcode's format rules. This could have
   * been due to a mis-detection.
   */
  ZXFormatError       = 1001,

  /**
   * Thrown when a barcode was not found in the image. It might have been
   * partially detected but could not be confirmed.
   */
  ZXNotFoundError     = 1002,

  /**
   * Thrown when an exception occurs during Reed-Solomon decoding, such as when
   * there are too many errors to correct.
   */
  ZXReedSolomonError  = 1003,

  /**
   * This general error is thrown when something goes wrong during decoding of a barcode.
   * This includes, but is not limited to, failing checksums / error correction algorithms, being
   * unable to locate finder timing patterns, and so on.
   */
  ZXReaderError       = 1004,

  /**
   * Covers the range of error which may occur when encoding a barcode using the Writer framework.
   */
  ZXWriterError       = 1005
};

// Helper methods for error instances
NSError *ZXChecksumErrorInstance(void);
NSError *ZXFormatErrorInstance(void);
NSError *ZXNotFoundErrorInstance(void);
