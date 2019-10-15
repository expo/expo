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

#import "ZXAztecDetector.h"
#import "ZXAztecDetectorResult.h"
#import "ZXErrors.h"
#import "ZXGenericGF.h"
#import "ZXGridSampler.h"
#import "ZXIntArray.h"
#import "ZXMathUtils.h"
#import "ZXReedSolomonDecoder.h"
#import "ZXResultPoint.h"
#import "ZXWhiteRectangleDetector.h"

@implementation ZXAztecPoint

- (id)initWithX:(int)x y:(int)y {
  if (self = [super init]) {
    _x = x;
    _y = y;
  }
  return self;
}

- (ZXResultPoint *)toResultPoint {
  return [[ZXResultPoint alloc] initWithX:self.x y:self.y];
}

- (NSString *)description {
  return [NSString stringWithFormat:@"<%d %d>", self.x, self.y];
}

@end

@interface ZXAztecDetector ()

@property (nonatomic, assign, getter = isCompact) BOOL compact;
@property (nonatomic, strong) ZXBitMatrix *image;
@property (nonatomic, assign) int nbCenterLayers;
@property (nonatomic, assign) int nbDataBlocks;
@property (nonatomic, assign) int nbLayers;
@property (nonatomic, assign) int shift;

@end

@implementation ZXAztecDetector

- (id)initWithImage:(ZXBitMatrix *)image {
  if (self = [super init]) {
    _image = image;
  }
  return self;
}

- (ZXAztecDetectorResult *)detectWithError:(NSError **)error {
  return [self detectWithMirror:NO error:error];
}

- (ZXAztecDetectorResult *)detectWithMirror:(BOOL)isMirror error:(NSError **)error {
  // 1. Get the center of the aztec matrix
  ZXAztecPoint *pCenter = [self matrixCenter];
  if (!pCenter) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  // 2. Get the center points of the four diagonal points just outside the bull's eye
  //  [topRight, bottomRight, bottomLeft, topLeft]
  NSMutableArray *bullsEyeCorners = [self bullsEyeCorners:pCenter];
  if (!bullsEyeCorners) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  if (isMirror) {
    ZXResultPoint *temp = bullsEyeCorners[0];
    bullsEyeCorners[0] = bullsEyeCorners[2];
    bullsEyeCorners[2] = temp;
  }

  // 3. Get the size of the matrix and other parameters from the bull's eye
  if (![self extractParameters:bullsEyeCorners]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  // 4. Sample the grid
  ZXBitMatrix *bits = [self sampleGrid:self.image
                               topLeft:bullsEyeCorners[self.shift % 4]
                              topRight:bullsEyeCorners[(self.shift + 1) % 4]
                           bottomRight:bullsEyeCorners[(self.shift + 2) % 4]
                            bottomLeft:bullsEyeCorners[(self.shift + 3) % 4]];
  if (!bits) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  // 5. Get the corners of the matrix.
  NSArray *corners = [self matrixCornerPoints:bullsEyeCorners];
  if (!corners) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  return [[ZXAztecDetectorResult alloc] initWithBits:bits
                                               points:corners
                                              compact:self.compact
                                         nbDatablocks:self.nbDataBlocks
                                             nbLayers:self.nbLayers];
}


/**
 * Extracts the number of data layers and data blocks from the layer around the bull's eye
 */
- (BOOL)extractParameters:(NSArray *)bullsEyeCorners {
  ZXResultPoint *p0 = bullsEyeCorners[0];
  ZXResultPoint *p1 = bullsEyeCorners[1];
  ZXResultPoint *p2 = bullsEyeCorners[2];
  ZXResultPoint *p3 = bullsEyeCorners[3];

  if (![self isValid:p0] || ![self isValid:p1] ||
      ![self isValid:p2] || ![self isValid:p3]) {
    return NO;
  }
  int length = 2 * self.nbCenterLayers;
  // Get the bits around the bull's eye
  int sides[] = {
    [self sampleLine:p0 p2:p1 size:length], // Right side
    [self sampleLine:p1 p2:p2 size:length], // Bottom
    [self sampleLine:p2 p2:p3 size:length], // Left side
    [self sampleLine:p3 p2:p0 size:length] // Top
  };

  // bullsEyeCorners[shift] is the corner of the bulls'eye that has three
  // orientation marks.
  // sides[shift] is the row/column that goes from the corner with three
  // orientation marks to the corner with two.
  int shift = [self rotationForSides:sides length:length];
  if (shift == -1) {
    return NO;
  }
  self.shift = shift;

  // Flatten the parameter bits into a single 28- or 40-bit long
  long parameterData = 0;
  for (int i = 0; i < 4; i++) {
    int side = sides[(self.shift + i) % 4];
    if (self.isCompact) {
      // Each side of the form ..XXXXXXX. where Xs are parameter data
      parameterData <<= 7;
      parameterData += (side >> 1) & 0x7F;
    } else {
      // Each side of the form ..XXXXX.XXXXX. where Xs are parameter data
      parameterData <<= 10;
      parameterData += ((side >> 2) & (0x1f << 5)) + ((side >> 1) & 0x1F);
    }
  }

  // Corrects parameter data using RS.  Returns just the data portion
  // without the error correction.
  int correctedData = [self correctedParameterData:parameterData compact:self.isCompact];
  if (correctedData == -1) {
    return NO;
  }

  if (self.isCompact) {
    // 8 bits:  2 bits layers and 6 bits data blocks
    self.nbLayers = (correctedData >> 6) + 1;
    self.nbDataBlocks = (correctedData & 0x3F) + 1;
  } else {
    // 16 bits:  5 bits layers and 11 bits data blocks
    self.nbLayers = (correctedData >> 11) + 1;
    self.nbDataBlocks = (correctedData & 0x7FF) + 1;
  }

  return YES;
}

static int expectedCornerBits[] = {
  0xee0,  // 07340  XXX .XX X.. ...
  0x1dc,  // 00734  ... XXX .XX X..
  0x83b,  // 04073  X.. ... XXX .XX
  0x707,  // 03407 .XX X.. ... XXX
};

static int bitCount(uint32_t i) {
  i = i - ((i >> 1) & 0x55555555);
  i = (i & 0x33333333) + ((i >> 2) & 0x33333333);
  return (((i + (i >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
}

- (int)rotationForSides:(const int[])sides length:(int)length {
  // In a normal pattern, we expect to See
  //   **    .*             D       A
  //   *      *
  //
  //   .      *
  //   ..    ..             C       B
  //
  // Grab the 3 bits from each of the sides the form the locator pattern and concatenate
  // into a 12-bit integer.  Start with the bit at A
  int cornerBits = 0;
  for (int i = 0; i < 4; i++) {
    int side = sides[i];
    // XX......X where X's are orientation marks
    int t = ((side >> (length - 2)) << 1) + (side & 1);
    cornerBits = (cornerBits << 3) + t;
  }
  // Mov the bottom bit to the top, so that the three bits of the locator pattern at A are
  // together.  cornerBits is now:
  //  3 orientation bits at A || 3 orientation bits at B || ... || 3 orientation bits at D
  cornerBits = ((cornerBits & 1) << 11) + (cornerBits >> 1);
  // The result shift indicates which element of BullsEyeCorners[] goes into the top-left
  // corner. Since the four rotation values have a Hamming distance of 8, we
  // can easily tolerate two errors.
  for (int shift = 0; shift < 4; shift++) {
    if (bitCount(cornerBits ^ expectedCornerBits[shift]) <= 2) {
      return shift;
    }
  }
  return -1;
}

/**
 * Corrects the parameter bits using Reed-Solomon algorithm.
 *
 * @param parameterData parameter bits
 * @param compact true if this is a compact Aztec code
 * @return -1 if the array contains too many errors
 */
- (int)correctedParameterData:(long)parameterData compact:(BOOL)compact {
  int numCodewords;
  int numDataCodewords;

  if (compact) {
    numCodewords = 7;
    numDataCodewords = 2;
  } else {
    numCodewords = 10;
    numDataCodewords = 4;
  }

  int numECCodewords = numCodewords - numDataCodewords;
  ZXIntArray *parameterWords = [[ZXIntArray alloc] initWithLength:numCodewords];
  for (int i = numCodewords - 1; i >= 0; --i) {
    parameterWords.array[i] = (int32_t) parameterData & 0xF;
    parameterData >>= 4;
  }

  ZXReedSolomonDecoder *rsDecoder = [[ZXReedSolomonDecoder alloc] initWithField:[ZXGenericGF AztecParam]];
  if (![rsDecoder decode:parameterWords twoS:numECCodewords error:nil]) {
    return NO;
  }
  // Toss the error correction.  Just return the data as an integer
  int result = 0;
  for (int i = 0; i < numDataCodewords; i++) {
    result = (result << 4) + parameterWords.array[i];
  }
  return result;
}

/**
 * Finds the corners of a bull-eye centered on the passed point.
 * This returns the centers of the diagonal points just outside the bull's eye
 * Returns [topRight, bottomRight, bottomLeft, topLeft]
 *
 * @param pCenter Center point
 * @return The corners of the bull-eye, or nil if no valid bull-eye can be found
 */
- (NSMutableArray *)bullsEyeCorners:(ZXAztecPoint *)pCenter {
  ZXAztecPoint *pina = pCenter;
  ZXAztecPoint *pinb = pCenter;
  ZXAztecPoint *pinc = pCenter;
  ZXAztecPoint *pind = pCenter;

  BOOL color = YES;

  for (self.nbCenterLayers = 1; self.nbCenterLayers < 9; self.nbCenterLayers++) {
    ZXAztecPoint *pouta = [self firstDifferent:pina color:color dx:1 dy:-1];
    ZXAztecPoint *poutb = [self firstDifferent:pinb color:color dx:1 dy:1];
    ZXAztecPoint *poutc = [self firstDifferent:pinc color:color dx:-1 dy:1];
    ZXAztecPoint *poutd = [self firstDifferent:pind color:color dx:-1 dy:-1];

    //d      a
    //
    //c      b

    if (self.nbCenterLayers > 2) {
      float q = [self distance:poutd b:pouta] * self.nbCenterLayers / ([self distance:pind b:pina] * (self.nbCenterLayers + 2));
      if (q < 0.75 || q > 1.25 || ![self isWhiteOrBlackRectangle:pouta p2:poutb p3:poutc p4:poutd]) {
        break;
      }
    }

    pina = pouta;
    pinb = poutb;
    pinc = poutc;
    pind = poutd;

    color = !color;
  }

  if (self.nbCenterLayers != 5 && self.nbCenterLayers != 7) {
    return nil;
  }

  self.compact = self.nbCenterLayers == 5;

  // Expand the square by .5 pixel in each direction so that we're on the border
  // between the white square and the black square
  ZXResultPoint *pinax = [[ZXResultPoint alloc] initWithX:pina.x + 0.5f y:pina.y - 0.5f];
  ZXResultPoint *pinbx = [[ZXResultPoint alloc] initWithX:pinb.x + 0.5f y:pinb.y + 0.5f];
  ZXResultPoint *pincx = [[ZXResultPoint alloc] initWithX:pinc.x - 0.5f y:pinc.y + 0.5f];
  ZXResultPoint *pindx = [[ZXResultPoint alloc] initWithX:pind.x - 0.5f y:pind.y - 0.5f];

  // Expand the square so that its corners are the centers of the points
  // just outside the bull's eye.
  return [[self expandSquare:@[pinax, pinbx, pincx, pindx]
                     oldSide:2 * self.nbCenterLayers - 3
                     newSide:2 * self.nbCenterLayers] mutableCopy];
}

/**
 * Finds a candidate center point of an Aztec code from an image
 */
- (ZXAztecPoint *)matrixCenter {
  ZXResultPoint *pointA;
  ZXResultPoint *pointB;
  ZXResultPoint *pointC;
  ZXResultPoint *pointD;

  ZXWhiteRectangleDetector *detector = [[ZXWhiteRectangleDetector alloc] initWithImage:self.image error:nil];
  NSArray *cornerPoints = [detector detectWithError:nil];

  if (cornerPoints) {
    pointA = cornerPoints[0];
    pointB = cornerPoints[1];
    pointC = cornerPoints[2];
    pointD = cornerPoints[3];
  } else {
    // This exception can be in case the initial rectangle is white
    // In that case, surely in the bull's eye, we try to expand the rectangle.
    int cx = self.image.width / 2;
    int cy = self.image.height / 2;
    pointA = [[self firstDifferent:[[ZXAztecPoint alloc] initWithX:cx + 7 y:cy - 7] color:NO dx:1 dy:-1] toResultPoint];
    pointB = [[self firstDifferent:[[ZXAztecPoint alloc] initWithX:cx + 7 y:cy + 7]  color:NO dx:1 dy:1] toResultPoint];
    pointC = [[self firstDifferent:[[ZXAztecPoint alloc] initWithX:cx - 7 y:cy + 7]  color:NO dx:-1 dy:1] toResultPoint];
    pointD = [[self firstDifferent:[[ZXAztecPoint alloc] initWithX:cx - 7 y:cy - 7]  color:NO dx:-1 dy:-1] toResultPoint];
  }

  //Compute the center of the rectangle
  int cx = [ZXMathUtils round:([pointA x] + [pointD x] + [pointB x] + [pointC x]) / 4.0f];
  int cy = [ZXMathUtils round:([pointA y] + [pointD y] + [pointB y] + [pointC y]) / 4.0f];

  // Redetermine the white rectangle starting from previously computed center.
  // This will ensure that we end up with a white rectangle in center bull's eye
  // in order to compute a more accurate center.
  detector = [[ZXWhiteRectangleDetector alloc] initWithImage:self.image initSize:15 x:cx y:cy error:nil];
  cornerPoints = [detector detectWithError:nil];

  if (cornerPoints) {
    pointA = cornerPoints[0];
    pointB = cornerPoints[1];
    pointC = cornerPoints[2];
    pointD = cornerPoints[3];
  } else {
    // This exception can be in case the initial rectangle is white
    // In that case we try to expand the rectangle.
    pointA = [[self firstDifferent:[[ZXAztecPoint alloc] initWithX:cx + 7 y:cy - 7]  color:NO dx:1 dy:-1] toResultPoint];
    pointB = [[self firstDifferent:[[ZXAztecPoint alloc] initWithX:cx + 7 y:cy + 7]  color:NO dx:1 dy:1] toResultPoint];
    pointC = [[self firstDifferent:[[ZXAztecPoint alloc] initWithX:cx - 7 y:cy + 7]  color:NO dx:-1 dy:1] toResultPoint];
    pointD = [[self firstDifferent:[[ZXAztecPoint alloc] initWithX:cx - 7 y:cy - 7] color:NO dx:-1 dy:-1] toResultPoint];
  }

  cx = [ZXMathUtils round:([pointA x] + [pointD x] + [pointB x] + [pointC x]) / 4];
  cy = [ZXMathUtils round:([pointA y] + [pointD y] + [pointB y] + [pointC y]) / 4];

  // Recompute the center of the rectangle
  return [[ZXAztecPoint alloc] initWithX:cx y:cy];
}

/**
 * Gets the Aztec code corners from the bull's eye corners and the parameters.
 *
 * @param bullsEyeCorners the array of bull's eye corners
 * @return the array of aztec code corners, or nil if the corner points do not fit in the image
 */
- (NSArray *)matrixCornerPoints:(NSArray *)bullsEyeCorners {
  return [self expandSquare:bullsEyeCorners oldSide:2 * self.nbCenterLayers newSide:[self dimension]];
}

/**
 * Creates a BitMatrix by sampling the provided image.
 * topLeft, topRight, bottomRight, and bottomLeft are the centers of the squares on the
 * diagonal just outside the bull's eye.
 */
- (ZXBitMatrix *)sampleGrid:(ZXBitMatrix *)anImage
                    topLeft:(ZXResultPoint *)topLeft
                   topRight:(ZXResultPoint *)topRight
                bottomRight:(ZXResultPoint *)bottomRight
                 bottomLeft:(ZXResultPoint *)bottomLeft {
  ZXGridSampler *sampler = [ZXGridSampler instance];
  int dimension = [self dimension];

  float low = dimension / 2.0f - self.nbCenterLayers;
  float high = dimension / 2.0f + self.nbCenterLayers;

  return [sampler sampleGrid:anImage
                  dimensionX:dimension
                  dimensionY:dimension
                       p1ToX:low p1ToY:low   // topleft
                       p2ToX:high p2ToY:low  // topright
                       p3ToX:high p3ToY:high // bottomright
                       p4ToX:low p4ToY:high  // bottomleft
                     p1FromX:topLeft.x p1FromY:topLeft.y
                     p2FromX:topRight.x p2FromY:topRight.y
                     p3FromX:bottomRight.x p3FromY:bottomRight.y
                     p4FromX:bottomLeft.x p4FromY:bottomLeft.y
                       error:nil];
}

/**
 * Samples a line.
 *
 * @param p1   start point (inclusive)
 * @param p2   end point (exclusive)
 * @param size number of bits
 * @return the array of bits as an int (first bit is high-order bit of result)
 */
- (int)sampleLine:(ZXResultPoint *)p1 p2:(ZXResultPoint *)p2 size:(int)size {
  int result = 0;

  float d = [self resultDistance:p1 b:p2];
  float moduleSize = d / size;
  float px = p1.x;
  float py = p1.y;
  float dx = moduleSize * (p2.x - p1.x) / d;
  float dy = moduleSize * (p2.y - p1.y) / d;
  for (int i = 0; i < size; i++) {
    if ([self.image getX:[ZXMathUtils round:px + i * dx] y:[ZXMathUtils round:py + i * dy]]) {
      result |= 1 << (size - i - 1);
    }
  }

  return result;
}

/**
 * @return true if the border of the rectangle passed in parameter is compound of white points only
 *         or black points only
 */
- (BOOL)isWhiteOrBlackRectangle:(ZXAztecPoint *)p1 p2:(ZXAztecPoint *)p2 p3:(ZXAztecPoint *)p3 p4:(ZXAztecPoint *)p4 {
  int corr = 3;

  p1 = [[ZXAztecPoint alloc] initWithX:p1.x - corr y:p1.y + corr];
  p2 = [[ZXAztecPoint alloc] initWithX:p2.x - corr y:p2.y - corr];
  p3 = [[ZXAztecPoint alloc] initWithX:p3.x + corr y:p3.y - corr];
  p4 = [[ZXAztecPoint alloc] initWithX:p4.x + corr y:p4.y + corr];

  int cInit = [self color:p4 p2:p1];

  if (cInit == 0) {
    return NO;
  }

  int c = [self color:p1 p2:p2];

  if (c != cInit) {
    return NO;
  }

  c = [self color:p2 p2:p3];

  if (c != cInit) {
    return NO;
  }

  c = [self color:p3 p2:p4];

  return c == cInit;
}

/**
 * Gets the color of a segment
 *
 * @return 1 if segment more than 90% black, -1 if segment is more than 90% white, 0 else
 */
- (int)color:(ZXAztecPoint *)p1 p2:(ZXAztecPoint *)p2 {
  float d = [self distance:p1 b:p2];
  float dx = (p2.x - p1.x) / d;
  float dy = (p2.y - p1.y) / d;
  int error = 0;

  float px = p1.x;
  float py = p1.y;

  BOOL colorModel = [self.image getX:p1.x y:p1.y];

  for (int i = 0; i < d; i++) {
    px += dx;
    py += dy;
    if ([self.image getX:[ZXMathUtils round:px] y:[ZXMathUtils round:py]] != colorModel) {
      error++;
    }
  }

  float errRatio = (float)error / d;

  if (errRatio > 0.1f && errRatio < 0.9f) {
    return 0;
  }

  return (errRatio <= 0.1f) == colorModel ? 1 : -1;
}

/**
 * Gets the coordinate of the first point with a different color in the given direction
 */
- (ZXAztecPoint *)firstDifferent:(ZXAztecPoint *)init color:(BOOL)color dx:(int)dx dy:(int)dy {
  int x = init.x + dx;
  int y = init.y + dy;

  while ([self isValidX:x y:y] && [self.image getX:x y:y] == color) {
    x += dx;
    y += dy;
  }

  x -= dx;
  y -= dy;

  while ([self isValidX:x y:y] && [self.image getX:x y:y] == color) {
    x += dx;
  }
  x -= dx;

  while ([self isValidX:x y:y] && [self.image getX:x y:y] == color) {
    y += dy;
  }
  y -= dy;

  return [[ZXAztecPoint alloc] initWithX:x y:y];
}

/**
 * Expand the square represented by the corner points by pushing out equally in all directions
 *
 * @param cornerPoints the corners of the square, which has the bull's eye at its center
 * @param oldSide the original length of the side of the square in the target bit matrix
 * @param newSide the new length of the size of the square in the target bit matrix
 * @return the corners of the expanded square
 */
- (NSArray *)expandSquare:(NSArray *)cornerPoints oldSide:(float)oldSide newSide:(float)newSide {
  ZXResultPoint *cornerPoints0 = (ZXResultPoint *)cornerPoints[0];
  ZXResultPoint *cornerPoints1 = (ZXResultPoint *)cornerPoints[1];
  ZXResultPoint *cornerPoints2 = (ZXResultPoint *)cornerPoints[2];
  ZXResultPoint *cornerPoints3 = (ZXResultPoint *)cornerPoints[3];

  float ratio = newSide / (2 * oldSide);
  float dx =  cornerPoints0.x - cornerPoints2.x;
  float dy = cornerPoints0.y - cornerPoints2.y;
  float centerx = (cornerPoints0.x + cornerPoints2.x) / 2.0f;
  float centery = (cornerPoints0.y + cornerPoints2.y) / 2.0f;

  ZXResultPoint *result0 = [[ZXResultPoint alloc] initWithX:centerx + ratio * dx y:centery + ratio * dy];
  ZXResultPoint *result2 = [[ZXResultPoint alloc] initWithX:centerx - ratio * dx y:centery - ratio * dy];

  dx = cornerPoints1.x - cornerPoints3.x;
  dy = cornerPoints1.y - cornerPoints3.y;
  centerx = (cornerPoints1.x + cornerPoints3.x) / 2.0f;
  centery = (cornerPoints1.y + cornerPoints3.y) / 2.0f;
  ZXResultPoint *result1 = [[ZXResultPoint alloc] initWithX:centerx + ratio * dx y:centery + ratio * dy];
  ZXResultPoint *result3 = [[ZXResultPoint alloc] initWithX:centerx - ratio * dx y:centery - ratio * dy];

  return @[result0, result1, result2, result3];
}

- (BOOL)isValidX:(int)x y:(int)y {
  return x >= 0 && x < self.image.width && y > 0 && y < self.image.height;
}

- (BOOL)isValid:(ZXResultPoint *)point {
  int x = [ZXMathUtils round:point.x];
  int y = [ZXMathUtils round:point.y];
  return [self isValidX:x y:y];
}

- (float)distance:(ZXAztecPoint *)a b:(ZXAztecPoint *)b {
  return [ZXMathUtils distance:a.x aY:a.y bX:b.x bY:b.y];
}

- (float)resultDistance:(ZXResultPoint *)a b:(ZXResultPoint *)b {
  return [ZXMathUtils distance:a.x aY:a.y bX:b.x bY:b.y];
}

- (int)dimension {
  if (self.compact) {
    return 4 * self.nbLayers + 11;
  }
  if (self.nbLayers <= 4) {
    return 4 * self.nbLayers + 15;
  }
  return 4 * self.nbLayers + 2 * ((self.nbLayers-4)/8 + 1) + 15;
}

@end
