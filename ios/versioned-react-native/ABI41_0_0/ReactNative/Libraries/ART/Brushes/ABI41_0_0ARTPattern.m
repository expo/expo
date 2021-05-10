/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0ARTPattern.h>

#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

#import "ABI41_0_0RCTConvert+ART.h"

@implementation ABI41_0_0ARTPattern
{
  CGImageRef _image;
  CGRect _rect;
}

- (instancetype)initWithArray:(NSArray<id /* imagesource + numbers */> *)array
{
  if ((self = [super initWithArray:array])) {
    if (array.count < 6) {
      ABI41_0_0RCTLogError(@"-[%@ %@] expects 6 elements, received %@",
                  self.class, NSStringFromSelector(_cmd), array);
      return nil;
    }
    _image = CGImageRetain([ABI41_0_0RCTConvert CGImage:array[1]]);
    _rect = [ABI41_0_0RCTConvert CGRect:array offset:2];
  }
  return self;
}

- (void)dealloc
{
  CGImageRelease(_image);
}

// Note: This could use applyFillColor with a pattern. This could be more efficient but
// to do that, we need to calculate our own user space CTM.

- (void)paint:(CGContextRef)context
{
  CGContextDrawTiledImage(context, _rect, _image);
}



@end
