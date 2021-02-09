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
 * Enumerates barcode formats known to this package. Please keep alphabetized.
 */
typedef enum {
  /** Aztec 2D barcode format. */
  kBarcodeFormatAztec,

  /** CODABAR 1D format. */
  kBarcodeFormatCodabar,

  /** Code 39 1D format. */
  kBarcodeFormatCode39,

  /** Code 93 1D format. */
  kBarcodeFormatCode93,

  /** Code 128 1D format. */
  kBarcodeFormatCode128,

  /** Data Matrix 2D barcode format. */
  kBarcodeFormatDataMatrix,

  /** EAN-8 1D format. */
  kBarcodeFormatEan8,

  /** EAN-13 1D format. */
  kBarcodeFormatEan13,

  /** ITF (Interleaved Two of Five) 1D format. */
  kBarcodeFormatITF,

  /** MaxiCode 2D barcode format. */
  kBarcodeFormatMaxiCode,

  /** PDF417 format. */
  kBarcodeFormatPDF417,

  /** QR Code 2D barcode format. */
  kBarcodeFormatQRCode,

  /** RSS 14 */
  kBarcodeFormatRSS14,

  /** RSS EXPANDED */
  kBarcodeFormatRSSExpanded,

  /** UPC-A 1D format. */
  kBarcodeFormatUPCA,

  /** UPC-E 1D format. */
  kBarcodeFormatUPCE,

  /** UPC/EAN extension format. Not a stand-alone format. */
  kBarcodeFormatUPCEANExtension
} ZXBarcodeFormat;
