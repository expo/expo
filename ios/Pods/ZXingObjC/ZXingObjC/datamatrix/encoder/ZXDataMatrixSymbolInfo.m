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

#import "ZXDataMatrixSymbolInfo.h"
#import "ZXDataMatrixSymbolInfo144.h"
#import "ZXDimension.h"

static NSArray *PROD_SYMBOLS = nil;
static NSArray *symbols = nil;

@implementation ZXDataMatrixSymbolInfo

+ (void)initialize {
  if ([self class] != [ZXDataMatrixSymbolInfo class]) return;

  PROD_SYMBOLS = @[[[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:3 errorCodewords:5 matrixWidth:8 matrixHeight:8 dataRegions:1],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:5 errorCodewords:7 matrixWidth:10 matrixHeight:10 dataRegions:1],
                   /*rect*/[[ZXDataMatrixSymbolInfo alloc] initWithRectangular:YES dataCapacity:5 errorCodewords:7 matrixWidth:16 matrixHeight:6 dataRegions:1],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:8 errorCodewords:10 matrixWidth:12 matrixHeight:12 dataRegions:1],
                   /*rect*/[[ZXDataMatrixSymbolInfo alloc] initWithRectangular:YES dataCapacity:10 errorCodewords:11 matrixWidth:14 matrixHeight:6 dataRegions:2],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:12 errorCodewords:12 matrixWidth:14 matrixHeight:14 dataRegions:1],
                   /*rect*/[[ZXDataMatrixSymbolInfo alloc] initWithRectangular:YES dataCapacity:16 errorCodewords:14 matrixWidth:24 matrixHeight:10 dataRegions:1],

                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:18 errorCodewords:14 matrixWidth:16 matrixHeight:16 dataRegions:1],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:22 errorCodewords:18 matrixWidth:18 matrixHeight:18 dataRegions:1],
                   /*rect*/[[ZXDataMatrixSymbolInfo alloc] initWithRectangular:YES dataCapacity:22 errorCodewords:18 matrixWidth:16 matrixHeight:10 dataRegions:2],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:30 errorCodewords:20 matrixWidth:20 matrixHeight:20 dataRegions:1],
                   /*rect*/[[ZXDataMatrixSymbolInfo alloc] initWithRectangular:YES dataCapacity:32 errorCodewords:24 matrixWidth:16 matrixHeight:14 dataRegions:2],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:36 errorCodewords:24 matrixWidth:22 matrixHeight:22 dataRegions:1],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:44 errorCodewords:28 matrixWidth:24 matrixHeight:24 dataRegions:1],
                   /*rect*/[[ZXDataMatrixSymbolInfo alloc] initWithRectangular:YES dataCapacity:49 errorCodewords:28 matrixWidth:22 matrixHeight:14 dataRegions:2],

                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:62 errorCodewords:36 matrixWidth:14 matrixHeight:14 dataRegions:4],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:86 errorCodewords:42 matrixWidth:16 matrixHeight:16 dataRegions:4],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:114 errorCodewords:48 matrixWidth:18 matrixHeight:18 dataRegions:4],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:144 errorCodewords:56 matrixWidth:20 matrixHeight:20 dataRegions:4],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:174 errorCodewords:68 matrixWidth:22 matrixHeight:22 dataRegions:4],

                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:204 errorCodewords:84 matrixWidth:24 matrixHeight:24 dataRegions:4 rsBlockData:102 rsBlockError:42],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:280 errorCodewords:112 matrixWidth:14 matrixHeight:14 dataRegions:16 rsBlockData:140 rsBlockError:56],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:368 errorCodewords:144 matrixWidth:16 matrixHeight:16 dataRegions:16 rsBlockData:92 rsBlockError:36],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:456 errorCodewords:192 matrixWidth:18 matrixHeight:18 dataRegions:16 rsBlockData:114 rsBlockError:48],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:576 errorCodewords:224 matrixWidth:20 matrixHeight:20 dataRegions:16 rsBlockData:144 rsBlockError:56],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:696 errorCodewords:272 matrixWidth:22 matrixHeight:22 dataRegions:16 rsBlockData:174 rsBlockError:68],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:816 errorCodewords:336 matrixWidth:24 matrixHeight:24 dataRegions:16 rsBlockData:136 rsBlockError:56],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:1050 errorCodewords:408 matrixWidth:18 matrixHeight:18 dataRegions:36 rsBlockData:175 rsBlockError:68],
                   [[ZXDataMatrixSymbolInfo alloc] initWithRectangular:NO dataCapacity:1304 errorCodewords:496 matrixWidth:20 matrixHeight:20 dataRegions:36 rsBlockData:163 rsBlockError:62],
                   [[ZXDataMatrixSymbolInfo144 alloc] init]];
  symbols = PROD_SYMBOLS;
}

+ (NSArray *)prodSymbols {
  return PROD_SYMBOLS;
}

+ (void)overrideSymbolSet:(NSArray *)override {
  symbols = override;
}

- (id)initWithRectangular:(BOOL)rectangular dataCapacity:(int)dataCapacity errorCodewords:(int)errorCodewords
              matrixWidth:(int)matrixWidth matrixHeight:(int)matrixHeight dataRegions:(int)dataRegions {
  return [self initWithRectangular:rectangular dataCapacity:dataCapacity errorCodewords:errorCodewords
                       matrixWidth:matrixWidth matrixHeight:matrixHeight dataRegions:dataRegions
                       rsBlockData:dataCapacity rsBlockError:errorCodewords];
}

- (id)initWithRectangular:(BOOL)rectangular dataCapacity:(int)dataCapacity errorCodewords:(int)errorCodewords
              matrixWidth:(int)matrixWidth matrixHeight:(int)matrixHeight dataRegions:(int)dataRegions
              rsBlockData:(int)rsBlockData rsBlockError:(int)rsBlockError {
  if (self = [super init]) {
    _rectangular = rectangular;
    _dataCapacity = dataCapacity;
    _errorCodewords = errorCodewords;
    _matrixWidth = matrixWidth;
    _matrixHeight = matrixHeight;
    _dataRegions = dataRegions;
    _rsBlockData = rsBlockData;
    _rsBlockError = rsBlockError;
  }

  return self;
}

+ (ZXDataMatrixSymbolInfo *)lookup:(int)dataCodewords {
  return [self lookup:dataCodewords shape:ZXDataMatrixSymbolShapeHintForceNone fail:YES];
}

+ (ZXDataMatrixSymbolInfo *)lookup:(int)dataCodewords shape:(ZXDataMatrixSymbolShapeHint)shape {
  return [self lookup:dataCodewords shape:shape fail:YES];
}

+ (ZXDataMatrixSymbolInfo *)lookup:(int)dataCodewords allowRectangular:(BOOL)allowRectangular fail:(BOOL)fail {
  ZXDataMatrixSymbolShapeHint shape = allowRectangular
    ? ZXDataMatrixSymbolShapeHintForceNone : ZXDataMatrixSymbolShapeHintForceSquare;
  return [self lookup:dataCodewords shape:shape fail:fail];
}

+ (ZXDataMatrixSymbolInfo *)lookup:(int)dataCodewords shape:(ZXDataMatrixSymbolShapeHint)shape fail:(BOOL)fail {
  return [self lookup:dataCodewords shape:shape minSize:nil maxSize:nil fail:fail];
}

+ (ZXDataMatrixSymbolInfo *)lookup:(int)dataCodewords shape:(ZXDataMatrixSymbolShapeHint)shape minSize:(ZXDimension *)minSize
                 maxSize:(ZXDimension *)maxSize fail:(BOOL)fail {
  for (ZXDataMatrixSymbolInfo *symbol in symbols) {
    if (shape == ZXDataMatrixSymbolShapeHintForceSquare && symbol.rectangular) {
      continue;
    }
    if (shape == ZXDataMatrixSymbolShapeHintForceRectangle && !symbol.rectangular) {
      continue;
    }
    if (minSize != nil
        && ([symbol symbolWidth] < minSize.width
            || [symbol symbolHeight] < minSize.height)) {
          continue;
        }
    if (maxSize != nil
        && ([symbol symbolWidth] > maxSize.width
            || [symbol symbolHeight] > maxSize.height)) {
          continue;
        }
    if (dataCodewords <= symbol.dataCapacity) {
      return symbol;
    }
  }
  if (fail) {
    [NSException raise:NSInvalidArgumentException format:@"Can't find a symbol arrangement that matches the message. Data codewords: %d", dataCodewords];
  }
  return nil;
}

- (int)horizontalDataRegions {
  switch (_dataRegions) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 2;
    case 16:
      return 4;
    case 36:
      return 6;
    default:
      @throw [NSException exceptionWithName:NSInvalidArgumentException reason:@"Cannot handle this number of data regions" userInfo:nil];
  }
}

- (int)verticalDataRegions {
  switch (_dataRegions) {
    case 1:
      return 1;
    case 2:
      return 1;
    case 4:
      return 2;
    case 16:
      return 4;
    case 36:
      return 6;
    default:
      @throw [NSException exceptionWithName:NSInvalidArgumentException reason:@"Cannot handle this number of data regions" userInfo:nil];
  }
}

- (int)symbolDataWidth {
  return [self horizontalDataRegions] * _matrixWidth;
}

- (int)symbolDataHeight {
  return [self verticalDataRegions] * _matrixHeight;
}

- (int)symbolWidth {
  return [self symbolDataWidth] + ([self horizontalDataRegions] * 2);
}

- (int)symbolHeight {
  return [self symbolDataHeight] + ([self verticalDataRegions] * 2);
}

- (int)codewordCount {
  return _dataCapacity + _errorCodewords;
}

- (int)interleavedBlockCount {
  return _dataCapacity / _rsBlockData;
}

- (int)dataLengthForInterleavedBlock:(int)index {
  return _rsBlockData;
}

- (int)errorLengthForInterleavedBlock:(int)index {
  return _rsBlockError;
}

- (NSString *)description {
  NSMutableString *sb = [NSMutableString string];
  [sb appendString:_rectangular ? @"Rectangular Symbol:" : @"Square Symbol:"];
  [sb appendFormat:@" data region %dx%d", _matrixWidth, _matrixHeight];
  [sb appendFormat:@", symbol size %dx%d", [self symbolWidth], [self symbolHeight]];
  [sb appendFormat:@", symbol data size %dx%d", [self symbolDataWidth], [self symbolDataHeight]];
  [sb appendFormat:@", codewords %d+%d", _dataCapacity, _errorCodewords];
  return [NSString stringWithString:sb];
}

@end
