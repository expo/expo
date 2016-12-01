/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI12_0_0RNSVGPattern.h"

#import "ABI12_0_0RCTConvert+RNSVG.h"
#import "ABI12_0_0RCTLog.h"

@implementation ABI12_0_0RNSVGPattern
{
  CGImageRef _image;
  CGRect _rect;
}

- (instancetype)initWithArray:(NSArray<id /* imagesource + numbers */> *)array
{
  if ((self = [super initWithArray:array])) {
    if (array.count < 6) {
      ABI12_0_0RCTLogError(@"-[%@ %@] expects 6 elements, received %@",
                  self.class, NSStringFromSelector(_cmd), array);
      return nil;
    }
    _image = CGImageRetain([ABI12_0_0RCTConvert CGImage:array[1]]);
    _rect = [ABI12_0_0RCTConvert CGRect:array offset:2];
  }
  return self;
}

- (void)dealloc
{
  CGImageRelease(_image);
}

// Note: This could use applyFillColor with a pattern. This could be more efficient but
// to do that, we need to calculate our own user space CTM.

- (void)paint:(CGContextRef)context opacity:(CGFloat)opacity brushConverter:(ABI12_0_0RNSVGBrushConverter *)brushConverter;
{
  CGContextDrawTiledImage(context, _rect, _image);
}



@end
