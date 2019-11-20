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
#import "ZXPDF417BarcodeRow.h"

@interface ZXPDF417BarcodeRow ()

//A tacker for position in the bar
@property (nonatomic, assign) int currentLocation;

@end

@implementation ZXPDF417BarcodeRow

+ (ZXPDF417BarcodeRow *)barcodeRowWithWidth:(int)width {
  return [[ZXPDF417BarcodeRow alloc] initWithWidth:width];
}

- (id)initWithWidth:(int)width {
  if (self = [super init]) {
    _row = [[ZXByteArray alloc] initWithLength:width];
    _currentLocation = 0;
  }
  return self;
}

- (void)setX:(int)x value:(int8_t)value {
  self.row.array[x] = value;
}

- (void)setX:(int)x black:(BOOL)black {
  self.row.array[x] = (int8_t) (black ? 1 : 0);
}

- (void)addBar:(BOOL)black width:(int)width {
  for (int ii = 0; ii < width; ii++) {
    [self setX:self.currentLocation++ black:black];
  }
}

- (ZXByteArray *)scaledRow:(int)scale {
  ZXByteArray *output = [[ZXByteArray alloc] initWithLength:self.row.length * scale];
  for (int i = 0; i < output.length; i++) {
    output.array[i] = self.row.array[i / scale];
  }
  return output;
}

@end
