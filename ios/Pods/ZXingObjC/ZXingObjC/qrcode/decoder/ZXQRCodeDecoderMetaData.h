/*
 * Copyright 2014 ZXing authors
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
 * Meta-data container for QR Code decoding. Instances of this class may be used to convey information back to the
 * decoding caller. Callers are expected to process this.
 */
@interface ZXQRCodeDecoderMetaData : NSObject

@property (nonatomic, assign, readonly) BOOL mirrored;

- (id)initWithMirrored:(BOOL)mirrored;

/**
 * Apply the result points' order correction due to mirroring.
 *
 * @param points Array of points to apply mirror correction to.
 */
- (void)applyMirroredCorrection:(NSMutableArray *)points;

@end
