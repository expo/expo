// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI26_0_0RCTWrapperShadowView.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>

#import "ABI26_0_0RCTWrapperView.h"

@implementation ABI26_0_0RCTWrapperShadowView
{
  __weak ABI26_0_0RCTBridge *_bridge;
  ABI26_0_0RCTWrapperMeasureBlock _measureBlock;
  CGSize _intrinsicContentSize;
}

- (instancetype)initWithBridge:(ABI26_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    ABI26_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI26_0_0RCTWrapperShadowViewMeasure);
  }

  return self;
}

static ABI26_0_0YGSize ABI26_0_0RCTWrapperShadowViewMeasure(ABI26_0_0YGNodeRef node, float width, ABI26_0_0YGMeasureMode widthMode, float height, ABI26_0_0YGMeasureMode heightMode)
{
  CGSize minimumSize = CGSizeMake(0, 0);
  CGSize maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  switch (widthMode) {
    case ABI26_0_0YGMeasureModeUndefined:
      break;
    case ABI26_0_0YGMeasureModeExactly:
      minimumSize.width = width;
      maximumSize.width = width;
      break;
    case ABI26_0_0YGMeasureModeAtMost:
      maximumSize.width = width;
      break;
  }

  switch (heightMode) {
    case ABI26_0_0YGMeasureModeUndefined:
      break;
    case ABI26_0_0YGMeasureModeExactly:
      minimumSize.height = height;
      maximumSize.height = height;
      break;
    case ABI26_0_0YGMeasureModeAtMost:
      maximumSize.height = height;
      break;
  }

  ABI26_0_0RCTWrapperShadowView *shadowView = (__bridge ABI26_0_0RCTWrapperShadowView *)ABI26_0_0YGNodeGetContext(node);
  CGSize size = [shadowView measureWithMinimumSize:minimumSize maximumSize:maximumSize];

  return (ABI26_0_0YGSize){
    ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(size.width),
    ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(size.height)
  };
}

- (CGSize)measureWithMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  dispatch_time_t timeout = dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC);

  if (!_measureBlock) {
    ABI26_0_0RCTBridge *bridge = _bridge;
    __block ABI26_0_0RCTWrapperMeasureBlock measureBlock;
    NSNumber *ReactABI26_0_0Tag = self.ReactABI26_0_0Tag;

    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

    dispatch_async(dispatch_get_main_queue(), ^{
      ABI26_0_0RCTUIManager *uiManager = bridge.uiManager;
      ABI26_0_0RCTWrapperView *view = (ABI26_0_0RCTWrapperView *)[uiManager viewForReactABI26_0_0Tag:ReactABI26_0_0Tag];
      measureBlock = view.measureBlock;

      dispatch_semaphore_signal(semaphore);
    });

    if (dispatch_semaphore_wait(semaphore, timeout)) {
      ABI26_0_0RCTLogError(@"Unable to retrieve `measureBlock` for view (%@) because the main thread is busy.", self);
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
    ABI26_0_0RCTLogError(@"Unable to compute layout for view (%@) because the main thread is busy.", self);
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
  ABI26_0_0YGNodeMarkDirty(self.yogaNode);
}

@end
