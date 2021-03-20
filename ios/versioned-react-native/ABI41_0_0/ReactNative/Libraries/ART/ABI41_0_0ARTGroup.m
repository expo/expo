/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0ARTGroup.h>

@implementation ABI41_0_0ARTGroup

- (void)renderLayerTo:(CGContextRef)context
{

  if (!CGRectIsEmpty(self.clipping)) {
    CGContextClipToRect(context, self.clipping);
  }

  for (ABI41_0_0ARTNode *node in self.subviews) {
    [node renderTo:context];
  }
}

@end
