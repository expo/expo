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

@class ZXBitArray, ZXByteArray, ZXEncodeHints, ZXQRCode, ZXQRCodeErrorCorrectionLevel, ZXQRCodeMode, ZXQRCodeVersion;

extern const NSStringEncoding ZX_DEFAULT_BYTE_MODE_ENCODING;

@interface ZXQRCodeEncoder : NSObject

/**
 * @param content text to encode
 * @param ecLevel error correction level to use
 * @return ZXQRCode representing the encoded QR code or nil if encoding can't succeed, because of
 *  for example invalid content or configuration.
 */
+ (ZXQRCode *)encode:(NSString *)content ecLevel:(ZXQRCodeErrorCorrectionLevel *)ecLevel error:(NSError **)error;

+ (ZXQRCode *)encode:(NSString *)content ecLevel:(ZXQRCodeErrorCorrectionLevel *)ecLevel hints:(ZXEncodeHints *)hints error:(NSError **)error;

/**
 * Return the code point of the table used in alphanumeric mode or
 * -1 if there is no corresponding code in the table.
 */
+ (int)alphanumericCode:(int)code;

/**
 * Terminate bits as described in 8.4.8 and 8.4.9 of JISX0510:2004 (p.24).
 */
+ (BOOL)terminateBits:(int)numDataBytes bits:(ZXBitArray *)bits error:(NSError **)error;

/**
 * Get number of data bytes and number of error correction bytes for block id "blockID". Store
 * the result in "numDataBytesInBlock", and "numECBytesInBlock". See table 12 in 8.5.1 of
 * JISX0510:2004 (p.30)
 */
+ (BOOL)numDataBytesAndNumECBytesForBlockID:(int)numTotalBytes numDataBytes:(int)numDataBytes numRSBlocks:(int)numRSBlocks blockID:(int)blockID numDataBytesInBlock:(int[])numDataBytesInBlock numECBytesInBlock:(int[])numECBytesInBlock error:(NSError **)error;

/**
 * Interleave "bits" with corresponding error correction bytes. On success, store the result in
 * "result". The interleave rule is complicated. See 8.6 of JISX0510:2004 (p.37) for details.
 */
+ (ZXBitArray *)interleaveWithECBytes:(ZXBitArray *)bits numTotalBytes:(int)numTotalBytes numDataBytes:(int)numDataBytes numRSBlocks:(int)numRSBlocks error:(NSError **)error;

+ (ZXByteArray *)generateECBytes:(ZXByteArray *)dataBytes numEcBytesInBlock:(int)numEcBytesInBlock;

/**
 * Append mode info. On success, store the result in "bits".
 */
+ (void)appendModeInfo:(ZXQRCodeMode *)mode bits:(ZXBitArray *)bits;

/**
 * Append length info. On success, store the result in "bits".
 */
+ (BOOL)appendLengthInfo:(int)numLetters version:(ZXQRCodeVersion *)version mode:(ZXQRCodeMode *)mode bits:(ZXBitArray *)bits error:(NSError **)error;

/**
 * Append "bytes" in "mode" mode (encoding) into "bits". On success, store the result in "bits".
 */
+ (BOOL)appendBytes:(NSString *)content mode:(ZXQRCodeMode *)mode bits:(ZXBitArray *)bits encoding:(NSStringEncoding)encoding error:(NSError **)error;

+ (void)appendNumericBytes:(NSString *)content bits:(ZXBitArray *)bits;

+ (BOOL)appendAlphanumericBytes:(NSString *)content bits:(ZXBitArray *)bits error:(NSError **)error;

+ (void)append8BitBytes:(NSString *)content bits:(ZXBitArray *)bits encoding:(NSStringEncoding)encoding;

+ (BOOL)appendKanjiBytes:(NSString *)content bits:(ZXBitArray *)bits error:(NSError **)error;

@end
