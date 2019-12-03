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
#import "ZXRGBLuminanceSource.h"

@interface ZXRGBLuminanceSource ()

@property (nonatomic, strong, readonly) ZXByteArray *luminances;
@property (nonatomic, assign, readonly) int dataWidth;
@property (nonatomic, assign, readonly) int dataHeight;
@property (nonatomic, assign, readonly) int left;
@property (nonatomic, assign, readonly) int top;

@end

@implementation ZXRGBLuminanceSource

- (id)initWithWidth:(int)width height:(int)height pixels:(int *)pixels pixelsLen:(int)pixelsLen {
  if (self = [super initWithWidth:width height:height]) {
    _dataWidth = width;
    _dataHeight = height;
    _left = 0;
    _top = 0;

    // In order to measure pure decoding speed, we convert the entire image to a greyscale array
    // up front, which is the same as the Y channel of the YUVLuminanceSource in the real app.
    int size = width * height;
    _luminances = [[ZXByteArray alloc] initWithLength:size];
    for (int offset = 0; offset < size; offset++) {
      int pixel = pixels[offset];
      int r = (pixel >> 16) & 0xff; // red
      int g2 = (pixel >> 7) & 0x1fe; // 2 * green
      int b = pixel & 0xff; // blue
      // Calculate green-favouring average cheaply
      _luminances.array[offset] = (int8_t) ((r + g2 + b) / 4);
    }
  }

  return self;
}

- (id)initWithPixels:(int8_t *)pixels width:(int)width height:(int)height {
  if (self = [super initWithWidth:width height:height]) {
    _dataWidth = width;
    _dataHeight = height;
    _left = 0;
    _top = 0;
    _luminances = [[ZXByteArray alloc] initWithArray:pixels length:width * height];
  }
  return self;
}

- (id)initWithPixels:(ZXByteArray *)pixels dataWidth:(int)dataWidth dataHeight:(int)dataHeight
                left:(int)left top:(int)top width:(int)width height:(int)height {
    if (self = [super initWithWidth:width height:height]) {
        if (left + self.width > dataWidth || top + self.height > dataHeight) {
            [NSException raise:NSInvalidArgumentException format:@"Crop rectangle does not fit within image data."];
        }
        
        _luminances = pixels;
        _dataWidth = dataWidth;
        _dataHeight = dataHeight;
        _left = left;
        _top = top;
    }
    
    return self;
}

- (ZXByteArray *)rowAtY:(int)y row:(ZXByteArray *)row {
  if (y < 0 || y >= self.height) {
    [NSException raise:NSInvalidArgumentException format:@"Requested row is outside the image: %d", y];
  }
  int width = self.width;
  if (!row || row.length < width) {
    row = [[ZXByteArray alloc] initWithLength:width];
  }
  int offset = (y + self.top) * self.dataWidth + self.left;
  memcpy(row.array, self.luminances.array + offset, self.width * sizeof(int8_t));
  return row;
}

- (ZXByteArray *)matrix {
  int width = self.width;
  int height = self.height;

  // If the caller asks for the entire underlying image, save the copy and give them the
  // original data. The docs specifically warn that result.length must be ignored.
  if (width == self.dataWidth && height == self.dataHeight) {
    return self.luminances;
  }

  int area = self.width * self.height;
  ZXByteArray *matrix = [[ZXByteArray alloc] initWithLength:area];
  int inputOffset = self.top * self.dataWidth + self.left;

  // If the width matches the full width of the underlying data, perform a single copy.
  if (self.width == self.dataWidth) {
    memcpy(matrix.array, self.luminances.array + inputOffset, area * sizeof(int8_t));
    return matrix;
  }

  // Otherwise copy one cropped row at a time.
  for (int y = 0; y < self.height; y++) {
    int outputOffset = y * self.width;
    memcpy(matrix.array + outputOffset, self.luminances.array + inputOffset, self.width * sizeof(int8_t));
    inputOffset += self.dataWidth;
  }
  return matrix;
}

- (BOOL)cropSupported {
  return YES;
}

- (ZXLuminanceSource *)crop:(int)left top:(int)top width:(int)width height:(int)height {
  return [[[self class] alloc] initWithPixels:self.luminances
                                    dataWidth:self.dataWidth
                                   dataHeight:self.dataHeight
                                         left:self.left + left
                                          top:self.top + top
                                        width:width
                                       height:height];
}

@end
