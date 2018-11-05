/* Copyright (c) 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GMUHeatmapTileLayer.h"

#import "GQTBounds.h"
#import "GQTPointQuadTree.h"

static const int kGMUTileSize = 512;
static const int kGMUMaxZoom = 22;
static const int kGMUMinZoomIntensity = 5;
static const int kGMUMaxZoomIntensity = 10;

static void FreeDataProviderData(void *info, const void *data, size_t size) { free((void *)data); }

// Holder for data which must be consistent when accessed from tile creation threads.
@interface GMUHeatmapTileCreationData : NSObject {
 @public
  GQTPointQuadTree *_quadTree;
  GQTBounds _bounds;
  NSUInteger _radius;
  NSArray<UIColor *> *_colorMap;
  NSArray<NSNumber *> *_maxIntensities;
  NSArray<NSNumber *> *_kernel;
}
@end

@implementation GMUHeatmapTileCreationData
@end

@implementation GMUHeatmapTileLayer {
  BOOL _dirty;
  GMUHeatmapTileCreationData *_data;
}

- (instancetype)init {
  if ((self = [super init])) {
    _radius = 20;
    NSArray<UIColor *> *gradientColors = @[
      [UIColor colorWithRed:102.f / 255.f green:225.f / 255.f blue:0 alpha:1],
      [UIColor colorWithRed:1.0f green:0 blue:0 alpha:1]
    ];
    _gradient = [[GMUGradient alloc] initWithColors:gradientColors
                                        startPoints:@[ @0.2f, @1.0f ]
                                       colorMapSize:1000];
    _dirty = YES;
    self.opacity = 0.7;
    self.tileSize = kGMUTileSize;
  }
  return self;
}

- (void)setRadius:(NSUInteger)value {
  _radius = value;
  _dirty = YES;
}

- (void)setGradient:(GMUGradient *)gradient {
  _gradient = gradient;
  _dirty = YES;
}

- (void)setWeightedData:(NSArray<GMUWeightedLatLng *> *)weightedData {
  _weightedData = [weightedData copy];
  _dirty = YES;
}

- (void)setMap:(GMSMapView *)map {
  if (_dirty) {
    [self prepare];
    _dirty = NO;
  }
  [super setMap:map];
}

- (GQTBounds)calculateBounds {
  GQTBounds result;
  result.minX = 0;
  result.minY = 0;
  result.maxX = 0;
  result.maxY = 0;
  if (_weightedData.count == 0) {
    return result;
  }
  GQTPoint point = [_weightedData[0] point];
  result.minX = result.maxX = point.x;
  result.minY = result.maxY = point.y;
  for (int i = 1; i < _weightedData.count; i++) {
    point = [_weightedData[i] point];
    if (result.minX > point.x) result.minX = point.x;
    if (result.maxX < point.x) result.maxX = point.x;
    if (result.minY > point.y) result.minY = point.y;
    if (result.maxY < point.y) result.maxY = point.y;
  }
  return result;
}

- (NSNumber *)maxValueForZoom:(int)zoom {
  // Bucket data in to areas equal to twice radius at the given zoom.
  // At zoom 0, one tile covers the entire range of -1 to 1.
  // So for zoom 0 bucket size should be 2*2*radius/512.
  // However in practice these buckets are too big, as it kind of assumes convolution with a kernel
  // which is 1 for the entire diameter.
  // Unless all the points are practically coincident within the bucket, this is quite wrong.
  // Therefore apply a magical factor to give something which is a bit better in practice.
  // TODO: apply magical factor squared to the final result rather than changing the bucket size?
  double magicalFactor = 0.5;
  double bucketSize = _radius / 128.0 / pow(2, zoom) * magicalFactor;
  NSMutableDictionary<NSNumber *, NSMutableDictionary<NSNumber *, NSNumber *> *> *lookupX =
      [NSMutableDictionary dictionary];
  float max = 0;
  for (GMUWeightedLatLng *dataPoint in _weightedData) {
    GQTPoint point = [dataPoint point];
    NSNumber *xBucket = @((int)((point.x + 1) / bucketSize));
    NSNumber *yBucket = @((int)((point.y + 1) / bucketSize));
    NSMutableDictionary<NSNumber *, NSNumber *> *lookupY = lookupX[xBucket];
    if (!lookupY) {
      lookupY = [NSMutableDictionary dictionary];
      lookupX[xBucket] = lookupY;
    }
    NSNumber *value = lookupY[yBucket];
    float newValue = [value floatValue] + dataPoint.intensity;
    if (newValue > max) max = newValue;
    lookupY[yBucket] = @(newValue);
  }
  return @(max);
}

- (NSArray<NSNumber *> *)calculateIntensities {
  // TODO: extract constants;
  NSMutableArray<NSNumber *> *intensities = [NSMutableArray arrayWithCapacity:kGMUMaxZoom];
  // Populate the array up to the min intensity with place holders until the min intensity is
  // calculated.
  for (int i = 0; i < kGMUMinZoomIntensity; i++) {
    intensities[i] = @0;
  }
  for (int i = kGMUMinZoomIntensity; i <= kGMUMaxZoomIntensity; i++) {
    intensities[i] = [self maxValueForZoom:i];
  }
  for (int i = 0; i < kGMUMinZoomIntensity; i++) {
    intensities[i] = intensities[kGMUMinZoomIntensity];
  }
  for (int i = kGMUMaxZoomIntensity + 1; i < kGMUMaxZoom; i++) {
    intensities[i] = intensities[kGMUMaxZoomIntensity];
  }
  return intensities;
}

- (NSArray<NSNumber *> *)generateKernel {
  float sd = _radius / 3.0;
  NSMutableArray<NSNumber *> *values = [NSMutableArray arrayWithCapacity:_radius * 2 + 1];
  for (int i = -(int)_radius; i <= (int)_radius; i++) {
    values[i + _radius] = @(expf(-i * i / (2 * sd * sd)));
  }
  return values;
}

- (void)prepare {
  GMUHeatmapTileCreationData *data = [[GMUHeatmapTileCreationData alloc] init];
  data->_bounds = [self calculateBounds];
  data->_quadTree = [[GQTPointQuadTree alloc] initWithBounds:data->_bounds];
  for (GMUWeightedLatLng *dataPoint in _weightedData) {
    [data->_quadTree add:dataPoint];
  }
  data->_colorMap = [_gradient generateColorMap];
  data->_maxIntensities = [self calculateIntensities];
  data->_kernel = [self generateKernel];
  data->_radius = _radius;
  @synchronized(self) {
    _data = data;
  }
}

- (UIImage *)tileForX:(NSUInteger)x y:(NSUInteger)y zoom:(NSUInteger)zoom {
  GMUHeatmapTileCreationData *data;
  @synchronized(self) {
    data = _data;
  }
  // Zoom 0 tile covers the world [-1, 1].
  double tileWidth = 2.0 / pow(2.0, zoom);
  double padding = tileWidth * data->_radius / kGMUTileSize;
  // One bucket per pixel.
  double bucketWidth = tileWidth / kGMUTileSize;
  double minX = -1 + x * tileWidth - padding;
  double maxX = -1 + (x + 1) * tileWidth + padding;
  // y axis for tile coordinates goes north to south, but y axis of world space goes south to north,
  // so this is inverted.
  double maxY = 1 - y * tileWidth + padding;
  double minY = 1 - (y + 1) * tileWidth - padding;

  double wrappedPointsOffset = 0;
  NSArray<GMUWeightedLatLng *> *wrappedPoints;
  if (minX < -1) {
    GQTBounds wrappedBounds;
    wrappedBounds.minX = minX + 2;
    wrappedBounds.maxX = 1.0;
    wrappedBounds.minY = minY;
    wrappedBounds.maxY = maxY;
    wrappedPoints = [data->_quadTree searchWithBounds:wrappedBounds];
    wrappedPointsOffset = -2;
  } else if (maxX > 1) {
    GQTBounds wrappedBounds;
    wrappedBounds.minX = -1.0;
    wrappedBounds.maxX = maxX - 2.0;
    wrappedBounds.minY = minY;
    wrappedBounds.maxY = maxY;
    wrappedPoints = [data->_quadTree searchWithBounds:wrappedBounds];
    wrappedPointsOffset = 2;
  }
  GQTBounds bounds;
  bounds.minX = minX;
  bounds.maxX = maxX;
  bounds.minY = minY;
  bounds.maxY = maxY;
  NSArray<GMUWeightedLatLng *> *points = [data->_quadTree searchWithBounds:bounds];
  // If there is no data at all return empty tile.
  if (points.count + wrappedPoints.count == 0) {
    return kGMSTileLayerNoTile;
  }

  // Quantize points.
  int paddedTileSize = kGMUTileSize + 2 * (int)data->_radius;
  float *intensity = calloc(paddedTileSize * paddedTileSize, sizeof(float));
  for (GMUWeightedLatLng *item in points) {
    GQTPoint p = [item point];
    int x = (int)((p.x - minX) / bucketWidth);
    // Flip y axis as world space goes south to north, but tile content goes north to south.
    int y = (int)((maxY - p.y) / bucketWidth);
    // If the point is just on the edge of the query area, the bucketing could put it outside
    // bounds.
    if (x >= paddedTileSize) x = paddedTileSize - 1;
    if (y >= paddedTileSize) y = paddedTileSize - 1;
    intensity[y * paddedTileSize + x] += item.intensity;
  }
  for (GMUWeightedLatLng *item in wrappedPoints) {
    GQTPoint p = [item point];
    int x = (int)((p.x + wrappedPointsOffset - minX) / bucketWidth);
    // Flip y axis as world space goes south to north, but tile content goes north to south.
    int y = (int)((maxY - p.y) / bucketWidth);
    // If the point is just on the edge of the query area, the bucketing could put it outside
    // bounds.
    if (x >= paddedTileSize) x = paddedTileSize - 1;
    if (y >= paddedTileSize) y = paddedTileSize - 1;
    // For wrapped points, additional shifting risks bucketing slipping just outside due to
    // numerical instability.
    if (x < 0) x = 0;
    intensity[y * paddedTileSize + x] += item.intensity;
  }

  // Convolve data.
  int lowerLimit = (int)data->_radius;
  int upperLimit = paddedTileSize - (int)data->_radius - 1;
  // Convolve horizontally first.
  float *intermediate = calloc(paddedTileSize * paddedTileSize, sizeof(float));
  for (int y = 0; y < paddedTileSize; y++) {
    for (int x = 0; x < paddedTileSize; x++) {
      float value = intensity[y * paddedTileSize + x];
      if (value != 0) {
        // convolve to x +/- radius bounded by the limit we care about.
        int start = MAX(lowerLimit, x - (int)data->_radius);
        int end = MIN(upperLimit, x + (int)data->_radius);
        for (int x2 = start; x2 <= end; x2++) {
          float scaledKernel = value * [data->_kernel[x2 - x + data->_radius] floatValue];
          intermediate[y * paddedTileSize + x2] += scaledKernel;
        }
      }
    }
  }
  free(intensity);
  // Convole vertically to get final intensity.
  float *finalIntensity = calloc(kGMUTileSize * kGMUTileSize, sizeof(float));
  for (int x = lowerLimit; x <= upperLimit; x++) {
    for (int y = 0; y < paddedTileSize; y++) {
      float value = intermediate[y * paddedTileSize + x];
      if (value != 0) {
        int start = MAX(lowerLimit, y - (int)data->_radius);
        int end = MIN(upperLimit, y + (int)data->_radius);
        for (int y2 = start; y2 <= end; y2++) {
          float scaledKernel = value * [data->_kernel[y2 - y + data->_radius] floatValue];
          finalIntensity[(y2 - lowerLimit) * kGMUTileSize + x - lowerLimit] += scaledKernel;
        }
      }
    }
  }
  free(intermediate);

  // Generate coloring.
  uint32_t *rawpixels = malloc(4 * kGMUTileSize * kGMUTileSize);
  float max = [data->_maxIntensities[zoom] floatValue];
  float scaling = (data->_colorMap.count - 1) / max;
  for (int y = 0; y < kGMUTileSize; y++) {
    for (int x = 0; x < kGMUTileSize; x++) {
      NSUInteger colorMapIndex = (NSUInteger)(finalIntensity[y * kGMUTileSize + x] * scaling);
      // Clamp out of range to the last color.
      if (colorMapIndex >= data->_colorMap.count) colorMapIndex = data->_colorMap.count - 1;
      UIColor *color = data->_colorMap[colorMapIndex];
      uint32_t rgba;
      CGFloat r, g, b, a;
      if ([color getRed:&r green:&g blue:&b alpha:&a]) {
        rgba = (((uint32_t)(a * 255)) << 24) + (((uint32_t)(b * 255)) << 16) +
               (((uint32_t)(g * 255)) << 8) + ((uint32_t)(r * 255));
      } else {
        // TODO: handle this error condition?
        rgba = 0;
      }
      rawpixels[y * kGMUTileSize + x] = rgba;
    }
  }
  free(finalIntensity);

  CGDataProviderRef provider = CGDataProviderCreateWithData(
      NULL, rawpixels, kGMUTileSize * kGMUTileSize * 4, FreeDataProviderData);

  CGColorSpaceRef colorSpaceRef = CGColorSpaceCreateDeviceRGB();
  CGImageRef imageRef = CGImageCreate(kGMUTileSize, kGMUTileSize, 8, 32, 4 * kGMUTileSize,
                                      colorSpaceRef, kCGBitmapByteOrder32Big | kCGImageAlphaLast,
                                      provider, NULL, NO, kCGRenderingIntentDefault);
  UIImage *newImage = [UIImage imageWithCGImage:imageRef];
  CGImageRelease(imageRef);
  CGColorSpaceRelease(colorSpaceRef);
  CGDataProviderRelease(provider);
  return newImage;
}

@end
