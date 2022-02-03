/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTWrapperShadowView.h"

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTShadowView+Layout.h>

#import "ABI43_0_0RCTWrapperView.h"

@implementation ABI43_0_0RCTWrapperShadowView
{
  __weak ABI43_0_0RCTBridge *_bridge;
  ABI43_0_0RCTWrapperMeasureBlock _measureBlock;
  CGSize _intrinsicContentSize;
}

- (instancetype)initWithBridge:(ABI43_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    ABI43_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI43_0_0RCTWrapperShadowViewMeasure);
  }

  return self;
}

static ABI43_0_0YGSize ABI43_0_0RCTWrapperShadowViewMeasure(ABI43_0_0YGNodeRef node, float width, ABI43_0_0YGMeasureMode widthMode, float height, ABI43_0_0YGMeasureMode heightMode)
{
  CGSize minimumSize = CGSizeMake(0, 0);
  CGSize maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  switch (widthMode) {
    case ABI43_0_0YGMeasureModeUndefined:
      break;
    case ABI43_0_0YGMeasureModeExactly:
      minimumSize.width = width;
      maximumSize.width = width;
      break;
    case ABI43_0_0YGMeasureModeAtMost:
      maximumSize.width = width;
      break;
  }

  switch (heightMode) {
    case ABI43_0_0YGMeasureModeUndefined:
      break;
    case ABI43_0_0YGMeasureModeExactly:
      minimumSize.height = height;
      maximumSize.height = height;
      break;
    case ABI43_0_0YGMeasureModeAtMost:
      maximumSize.height = height;
      break;
  }

  ABI43_0_0RCTWrapperShadowView *shadowView = (__bridge ABI43_0_0RCTWrapperShadowView *)ABI43_0_0YGNodeGetContext(node);
  CGSize size = [shadowView measureWithMinimumSize:minimumSize maximumSize:maximumSize];

  return (ABI43_0_0YGSize){
    ABI43_0_0RCTYogaFloatFromCoreGraphicsFloat(size.width),
    ABI43_0_0RCTYogaFloatFromCoreGraphicsFloat(size.height)
  };
}

- (CGSize)measureWithMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  dispatch_time_t timeout = dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC);

  if (!_measureBlock) {
    ABI43_0_0RCTBridge *bridge = _bridge;
    __block ABI43_0_0RCTWrapperMeasureBlock measureBlock;
    NSNumber *ABI43_0_0ReactTag = self.ABI43_0_0ReactTag;

    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

    dispatch_async(dispatch_get_main_queue(), ^{
      ABI43_0_0RCTUIManager *uiManager = bridge.uiManager;
      ABI43_0_0RCTWrapperView *view = (ABI43_0_0RCTWrapperView *)[uiManager viewForABI43_0_0ReactTag:ABI43_0_0ReactTag];
      measureBlock = view.measureBlock;

      dispatch_semaphore_signal(semaphore);
    });

    if (dispatch_semaphore_wait(semaphore, timeout)) {
      ABI43_0_0RCTLogError(@"Unable to retrieve `measureBlock` for view (%@) because the main thread is busy.", self);
    }

    _measureBlock = measureBlock;
  }

  if (!_measureBlock) {
    return maximumSize;
  }

  __block CGSize size = maximumSize;

  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

  dispatch_async(dispatch_get_main_queue(), ^{
    size = self->_measureBlock(minimumSize, maximumSize);
    dispatch_semaphore_signal(semaphore);
  });

  if (dispatch_semaphore_wait(semaphore, timeout)) {
    ABI43_0_0RCTLogError(@"Unable to compute layout for view (%@) because the main thread is busy.", self);
  }

  return size;
}

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (CGSize)intrinsicContentSize
{
  return _intrinsicContentSize;
}

- (void)setIntrinsicContentSize:(CGSize)size
{
  _intrinsicContentSize = size;
  ABI43_0_0YGNodeMarkDirty(self.yogaNode);
}

@end
