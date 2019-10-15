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

#import "ZXByteMatrix.h"
#import "ZXQRCode.h"
#import "ZXQRCodeErrorCorrectionLevel.h"
#import "ZXQRCodeMode.h"

const int ZX_NUM_MASK_PATTERNS = 8;

@implementation ZXQRCode

- (id)init {
  if (self = [super init]) {
    _mode = nil;
    _ecLevel = nil;
    _version = nil;
    _maskPattern = -1;
    _matrix = nil;
  }

  return self;
}

- (NSString *)description {
  NSMutableString *result = [NSMutableString stringWithCapacity:200];
  [result appendFormat:@"<<\n mode: %@", self.mode];
  [result appendFormat:@"\n ecLevel: %@", self.ecLevel];
  [result appendFormat:@"\n version: %@", self.version];
  [result appendFormat:@"\n maskPattern: %d", self.maskPattern];
  if (self.matrix == nil) {
    [result appendString:@"\n matrix: (null)\n"];
  } else {
    [result appendFormat:@"\n matrix:\n%@", [self.matrix description]];
  }
  [result appendString:@">>\n"];
  return [NSString stringWithString:result];
}

// Check if "mask_pattern" is valid.
+ (BOOL)isValidMaskPattern:(int)maskPattern {
  return maskPattern >= 0 && maskPattern < ZX_NUM_MASK_PATTERNS;
}

@end
