/*
 * Copyright 2013 ZXing authors
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

#import "ZXPDF417BoundingBox.h"
#import "ZXPDF417Codeword.h"
#import "ZXPDF417DetectionResultColumn.h"

const int ZX_PDF417_MAX_NEARBY_DISTANCE = 5;

@implementation ZXPDF417DetectionResultColumn

- (id)initWithBoundingBox:(ZXPDF417BoundingBox *)boundingBox {
  self = [super init];
  if (self) {
    _boundingBox = [[ZXPDF417BoundingBox alloc] initWithBoundingBox:boundingBox];
    _codewords = [NSMutableArray array];
    for (int i = 0; i < boundingBox.maxY - boundingBox.minY + 1; i++) {
      [_codewords addObject:[NSNull null]];
    }
  }

  return self;
}

- (ZXPDF417Codeword *)codewordNearby:(int)imageRow {
  ZXPDF417Codeword *codeword = [self codeword:imageRow];
  if (codeword) {
    return codeword;
  }
  for (int i = 1; i < ZX_PDF417_MAX_NEARBY_DISTANCE; i++) {
    int nearImageRow = [self imageRowToCodewordIndex:imageRow] - i;
    if (nearImageRow >= 0) {
      codeword = self.codewords[nearImageRow];
      if ((id)codeword != [NSNull null]) {
        return codeword;
      }
    }
    nearImageRow = [self imageRowToCodewordIndex:imageRow] + i;
    if (nearImageRow < [self.codewords count]) {
      codeword = self.codewords[nearImageRow];
      if ((id)codeword != [NSNull null]) {
        return codeword;
      }
    }
  }
  return nil;
}

- (int)imageRowToCodewordIndex:(int)imageRow {
  return imageRow - self.boundingBox.minY;
}

- (void)setCodeword:(int)imageRow codeword:(ZXPDF417Codeword *)codeword {
  _codewords[[self imageRowToCodewordIndex:imageRow]] = codeword;
}

- (ZXPDF417Codeword *)codeword:(int)imageRow {
  NSUInteger index = [self imageRowToCodewordIndex:imageRow];
  if (_codewords[index] == [NSNull null]) {
    return nil;
  }
  return _codewords[index];
}

- (NSString *)description {
  NSMutableString *result = [NSMutableString string];
  int row = 0;
  for (ZXPDF417Codeword *codeword in self.codewords) {
    if ((id)codeword == [NSNull null]) {
      [result appendFormat:@"%3d:    |   \n", row++];
      continue;
    }
    [result appendFormat:@"%3d: %3d|%3d\n", row++, codeword.rowNumber, codeword.value];
  }
  return [NSString stringWithString:result];
}

@end
