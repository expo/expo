/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTShadowVirtualImage.h"
#import "ABI5_0_0RCTImageLoader.h"
#import "ABI5_0_0RCTImageUtils.h"
#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTUIManager.h"
#import "ABI5_0_0RCTUtils.h"

@implementation ABI5_0_0RCTShadowVirtualImage
{
  ABI5_0_0RCTBridge *_bridge;
  ABI5_0_0RCTImageLoaderCancellationBlock _cancellationBlock;
}

@synthesize image = _image;

- (instancetype)initWithBridge:(ABI5_0_0RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

ABI5_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];

  if (changedProps.count == 0) {
    // No need to reload image
    return;
  }

  // Cancel previous request
  if (_cancellationBlock) {
    _cancellationBlock();
  }

  CGSize imageSize = {
    ABI5_0_0RCTZeroIfNaN(self.width),
    ABI5_0_0RCTZeroIfNaN(self.height),
  };

  if (!_image) {
    _image = ABI5_0_0RCTGetPlaceholderImage(imageSize, nil);
  }

  __weak ABI5_0_0RCTShadowVirtualImage *weakSelf = self;
  _cancellationBlock = [_bridge.imageLoader loadImageWithTag:_source.imageURL.absoluteString
                                                        size:imageSize
                                                       scale:ABI5_0_0RCTScreenScale()
                                                  resizeMode:_resizeMode
                                               progressBlock:nil
                                             completionBlock:^(NSError *error, UIImage *image) {

    dispatch_async(_bridge.uiManager.methodQueue, ^{
      ABI5_0_0RCTShadowVirtualImage *strongSelf = weakSelf;
      if (![_source isEqual:strongSelf.source]) {
        // Bail out if source has changed since we started loading
        return;
      }
      strongSelf->_image = image;
      [strongSelf dirtyText];
    });
  }];
}

- (void)dealloc
{
  if (_cancellationBlock) {
    _cancellationBlock();
  }
}

@end
