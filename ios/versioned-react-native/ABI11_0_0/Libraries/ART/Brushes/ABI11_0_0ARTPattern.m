/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0ARTPattern.h"

#import "ABI11_0_0RCTConvert+ART.h"
#import "ABI11_0_0RCTLog.h"

@implementation ABI11_0_0ARTPattern
{
  CGImageRef _image;
  CGRect _rect;
}

- (instancetype)initWithArray:(NSArray<id /* imagesource + numbers */> *)array
{
  if ((self = [super initWithArray:array])) {
    if (array.count < 6) {
      ABI11_0_0RCTLogError(@"-[%@ %@] expects 6 elements, received %@",
                  self.class, NSStringFromSelector(_cmd), array);
      return nil;
    }
    _image = CGImageRetain([ABI11_0_0RCTConvert CGImage:array[1]]);
    _rect = [ABI11_0_0RCTConvert CGRect:array offset:2];
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
