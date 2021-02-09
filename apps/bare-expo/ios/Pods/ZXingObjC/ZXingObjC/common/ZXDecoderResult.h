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

#import "ZXByteArray.h"

@class ZXByteArray;

/**
 * Encapsulates the result of decoding a matrix of bits. This typically
 * applies to 2D barcode formats. For now it contains the raw bytes obtained,
 * as well as a String interpretation of those bytes, if applicable.
 */
@interface ZXDecoderResult : NSObject

@property (nonatomic, strong, readonly) ZXByteArray *rawBytes;
@property (nonatomic) int numBits;
@property (nonatomic, copy, readonly) NSString *text;
@property (nonatomic, strong, readonly) NSMutableArray *byteSegments;
@property (nonatomic, copy, readonly) NSString *ecLevel;
@property (nonatomic, copy) NSNumber *errorsCorrected;
@property (nonatomic, copy) NSNumber *erasures;
@property (nonatomic, strong) id other;
@property (nonatomic, assign, readonly) int structuredAppendParity;
@property (nonatomic, assign, readonly) int structuredAppendSequenceNumber;

- (id)initWithRawBytes:(ZXByteArray *)rawBytes text:(NSString *)text
          byteSegments:(NSMutableArray *)byteSegments ecLevel:(NSString *)ecLevel;

- (id)initWithRawBytes:(ZXByteArray *)rawBytes text:(NSString *)text
          byteSegments:(NSMutableArray *)byteSegments ecLevel:(NSString *)ecLevel
            saSequence:(int)saSequence saParity:(int)saParity;

- (BOOL)hasStructuredAppend;

@end
