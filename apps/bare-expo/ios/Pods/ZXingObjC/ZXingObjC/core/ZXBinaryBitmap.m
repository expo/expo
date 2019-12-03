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

#import "ZXBinarizer.h"
#import "ZXBinaryBitmap.h"
#import "ZXBitArray.h"
#import "ZXBitMatrix.h"

@interface ZXBinaryBitmap ()

@property (nonatomic, strong, readonly) ZXBinarizer *binarizer;
@property (nonatomic, strong) ZXBitMatrix *matrix;

@end

@implementation ZXBinaryBitmap

- (id)initWithBinarizer:(ZXBinarizer *)binarizer {
  if (self = [super init]) {
    if (binarizer == nil) {
      [NSException raise:NSInvalidArgumentException format:@"Binarizer must be non-null."];
    }

    _binarizer = binarizer;
  }

  return self;
}

+ (id)binaryBitmapWithBinarizer:(ZXBinarizer *)binarizer {
  return [[self alloc] initWithBinarizer:binarizer];
}

- (int)width {
  return self.binarizer.width;
}

- (int)height {
  return self.binarizer.height;
}

- (ZXBitArray *)blackRow:(int)y row:(ZXBitArray *)row error:(NSError **)error {
  return [self.binarizer blackRow:y row:row error:error];
}

- (ZXBitMatrix *)blackMatrixWithError:(NSError **)error {
  if (self.matrix == nil) {
    self.matrix = [self.binarizer blackMatrixWithError:error];
  }
  return self.matrix;
}

- (BOOL)cropSupported {
  return [self.binarizer luminanceSource].cropSupported;
}

- (ZXBinaryBitmap *)crop:(int)left top:(int)top width:(int)aWidth height:(int)aHeight {
  ZXLuminanceSource *newSource = [[self.binarizer luminanceSource] crop:left top:top width:aWidth height:aHeight];
  return [[ZXBinaryBitmap alloc] initWithBinarizer:[self.binarizer createBinarizer:newSource]];
}

- (BOOL)rotateSupported {
  return [self.binarizer luminanceSource].rotateSupported;
}

- (ZXBinaryBitmap *)rotateCounterClockwise {
  ZXLuminanceSource *newSource = [[self.binarizer luminanceSource] rotateCounterClockwise];
  return [[ZXBinaryBitmap alloc] initWithBinarizer:[self.binarizer createBinarizer:newSource]];
}

- (ZXBinaryBitmap *)rotateCounterClockwise45 {
  ZXLuminanceSource *newSource = [[self.binarizer luminanceSource] rotateCounterClockwise45];
  return [[ZXBinaryBitmap alloc] initWithBinarizer:[self.binarizer createBinarizer:newSource]];
}

- (NSString *)description {
  ZXBitMatrix *matrix = [self blackMatrixWithError:nil];
  if (matrix) {
    return [matrix description];
  } else {
    return @"";
  }
}

@end
