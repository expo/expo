/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTImageURLLoaderWithAttribution.h"

@implementation ABI40_0_0RCTImageURLLoaderRequest

- (instancetype)initWithRequestId:(NSString *)requestId imageURL:(NSURL *)imageURL cancellationBlock:(ABI40_0_0RCTImageLoaderCancellationBlock)cancellationBlock
{
  if (self = [super init]) {
    _requestId = requestId;
    _imageURL = imageURL;
    _cancellationBlock = cancellationBlock;
  }

  return self;
}

- (void)cancel
{
  if (_cancellationBlock) {
    _cancellationBlock();
  }
}

@end
