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

#import "ZXQRCodeDetector.h"

/**
 * Encapsulates logic that can detect one or more QR Codes in an image, even if the QR Code
 * is rotated or skewed, or partially obscured.
 */

@class ZXDecodeHints;

@interface ZXMultiDetector : ZXQRCodeDetector

- (NSArray *)detectMulti:(ZXDecodeHints *)hints error:(NSError **)error;

@end
