// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI25_0_0RCTWrapperShadowView.h"

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>

#import "ABI25_0_0RCTWrapperView.h"

@implementation ABI25_0_0RCTWrapperShadowView
{
  __weak ABI25_0_0RCTBridge *_bridge;
  ABI25_0_0RCTWrapperMeasureBlock _measureBlock;
  CGSize _intrinsicContentSize;
}

- (instancetype)initWithBridge:(ABI25_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    ABI25_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI25_0_0RCTWrapperShadowViewMeasure);
  }

  return self;
}

static ABI25_0_0YGSize ABI25_0_0RCTWrapperShadowViewMeasure(ABI25_0_0YGNodeRef node, float width, ABI25_0_0YGMeasureMode widthMode, float height, ABI25_0_0YGMeasureMode heightMode)
{
  CGSize minimumSize = CGSizeMake(0, 0);
  CGSize maximumSize = CGSizeMake(INFINITY, INFINITY);

  switch (widthMode) {
    case ABI25_0_0YGMeasureModeUndefined:
      break;
    case ABI25_0_0YGMeasureModeExactly:
      minimumSize.width = width;
      maximumSize.width = width;
      break;
    case ABI25_0_0YGMeasureModeAtMost:
      maximumSize.width = width;
      break;
  }

  switch (heightMode) {
    case ABI25_0_0YGMeasureModeUndefined:
      break;
    case ABI25_0_0YGMeasureModeExactly:
      minimumSize.height = height;
      maximumSize.height = height;
      break;
    case ABI25_0_0YGMeasureModeAtMost:
      maximumSize.height = height;
      break;
  }

  ABI25_0_0RCTWrapperShadowView *shadowView = (__bridge ABI25_0_0RCTWrapperShadowView *)ABI25_0_0YGNodeGetContext(node);
  CGSize size = [shadowView measureWithMinimumSize:minimumSize maximumSize:maximumSize];
  return (ABI25_0_0YGSize){size.width, size.height};
}

- (CGSize)measureWithMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  dispatch_time_t timeout = dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC);

  if (!_measureBlock) {
    ABI25_0_0RCTBridge *bridge = _bridge;
    __block ABI25_0_0RCTWrapperMeasureBlock measureBlock;
    NSNumber *ReactABI25_0_0Tag = self.ReactABI25_0_0Tag;

    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

    dispatch_async(dispatch_get_main_queue(), ^{
      ABI25_0_0RCTUIManager *uiManager = bridge.uiManager;
      ABI25_0_0RCTWrapperView *view = (ABI25_0_0RCTWrapperView *)[uiManager viewForReactABI25_0_0Tag:ReactABI25_0_0Tag];
      measureBlock = view.measureBlock;

      dispatch_semaphore_signal(semaphore);
    });

    if (dispatch_semaphore_wait(semaphore, timeout)) {
      ABI25_0_0RCTLogError(@"Unable to retrieve `measureBlock` for view (%@) because the main thread is busy.", self);
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
    ABI25_0_0RCTLogError(@"Unable to compute layout for view (%@) because the main thread is busy.", self);
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
  ABI25_0_0YGNodeMarkDirty(self.yogaNode);
}

@end
