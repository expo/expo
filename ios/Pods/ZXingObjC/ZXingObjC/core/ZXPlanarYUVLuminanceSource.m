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
#import "ZXPlanarYUVLuminanceSource.h"

const int THUMBNAIL_SCALE_FACTOR = 2;

@interface ZXPlanarYUVLuminanceSource ()

@property (nonatomic, strong, readonly) ZXByteArray *yuvData;
@property (nonatomic, assign, readonly) int dataWidth;
@property (nonatomic, assign, readonly) int dataHeight;
@property (nonatomic, assign, readonly) int left;
@property (nonatomic, assign, readonly) int top;

@end

@implementation ZXPlanarYUVLuminanceSource

- (id)initWithYuvData:(int8_t *)yuvData yuvDataLen:(int)yuvDataLen dataWidth:(int)dataWidth
           dataHeight:(int)dataHeight left:(int)left top:(int)top width:(int)width height:(int)height
    reverseHorizontal:(BOOL)reverseHorizontal {
  if (self = [super initWithWidth:width height:height]) {
    if (left + width > dataWidth || top + height > dataHeight) {
      [NSException raise:NSInvalidArgumentException format:@"Crop rectangle does not fit within image data."];
    }

    _yuvData = [[ZXByteArray alloc] initWithLength:yuvDataLen];
    memcpy(_yuvData.array, yuvData, yuvDataLen * sizeof(int8_t));
    _dataWidth = dataWidth;
    _dataHeight = dataHeight;
    _left = left;
    _top = top;

    if (reverseHorizontal) {
      [self reverseHorizontal:width height:height];
    }
  }

  return self;
}

- (ZXByteArray *)rowAtY:(int)y row:(ZXByteArray *)row {
  if (y < 0 || y >= self.height) {
    [NSException raise:NSInvalidArgumentException
                format:@"Requested row is outside the image: %d", y];
  }
  int width = self.width;
  if (!row || row.length < width) {
    row = [[ZXByteArray alloc] initWithLength:width];
  }
  int offset = (y + self.top) * self.dataWidth + self.left;
  memcpy(row.array, self.yuvData.array + offset, self.width * sizeof(int8_t));
  return row;
}

- (ZXByteArray *)matrix {
  int width = self.width;
  int height = self.height;

  // If the caller asks for the entire underlying image, save the copy and give them the
  // original data. The docs specifically warn that result.length must be ignored.
  if (width == self.dataWidth && height == self.dataHeight) {
    return self.yuvData;
  }

  int area = self.width * self.height;
  ZXByteArray *matrix = [[ZXByteArray alloc] initWithLength:area];
  int inputOffset = self.top * self.dataWidth + self.left;

  // If the width matches the full width of the underlying data, perform a single copy.
  if (self.width == self.dataWidth) {
    memcpy(matrix.array, self.yuvData.array + inputOffset, (area - inputOffset) * sizeof(int8_t));
    return matrix;
  }

  // Otherwise copy one cropped row at a time.
  ZXByteArray *yuvData = self.yuvData;
  for (int y = 0; y < self.height; y++) {
    int outputOffset = y * self.width;
    memcpy(matrix.array + outputOffset, yuvData.array + inputOffset, self.width * sizeof(int8_t));
    inputOffset += self.dataWidth;
  }
  return matrix;
}

- (BOOL)cropSupported {
  return YES;
}

- (ZXLuminanceSource *)crop:(int)left top:(int)top width:(int)width height:(int)height {
  return [[[self class] alloc] initWithYuvData:self.yuvData.array yuvDataLen:self.yuvData.length dataWidth:self.dataWidth
                                    dataHeight:self.dataHeight left:self.left + left top:self.top + top
                                         width:width height:height reverseHorizontal:NO];
}

- (int *)renderThumbnail {
  int thumbWidth = self.width / THUMBNAIL_SCALE_FACTOR;
  int thumbHeight = self.height / THUMBNAIL_SCALE_FACTOR;
  int *pixels = (int *)malloc(thumbWidth * thumbHeight * sizeof(int));
  int inputOffset = self.top * self.dataWidth + self.left;

  for (int y = 0; y < self.height; y++) {
    int outputOffset = y * self.width;
    for (int x = 0; x < self.width; x++) {
      int grey = self.yuvData.array[inputOffset + x * THUMBNAIL_SCALE_FACTOR] & 0xff;
      pixels[outputOffset + x] = 0xFF000000 | (grey * 0x00010101);
    }
    inputOffset += self.dataWidth * THUMBNAIL_SCALE_FACTOR;
  }
  return pixels;
}

- (int)thumbnailWidth {
  return self.width / THUMBNAIL_SCALE_FACTOR;
}

- (int)thumbnailHeight {
  return self.height / THUMBNAIL_SCALE_FACTOR;
}

- (void)reverseHorizontal:(int)width height:(int)height {
  for (int y = 0, rowStart = self.top * self.dataWidth + self.left; y < height; y++, rowStart += self.dataWidth) {
    int middle = rowStart + width / 2;
    for (int x1 = rowStart, x2 = rowStart + width - 1; x1 < middle; x1++, x2--) {
      int8_t temp = self.yuvData.array[x1];
      self.yuvData.array[x1] = self.yuvData.array[x2];
      self.yuvData.array[x2] = temp;
    }
  }
}

@end
