// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI26_0_0RCTWrapperViewManager.h"

#import "ABI26_0_0RCTWrapperShadowView.h"
#import "ABI26_0_0RCTWrapperView.h"

@implementation ABI26_0_0RCTWrapperViewManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RCTShadowView *)shadowView
{
  return [[ABI26_0_0RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[ABI26_0_0RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
