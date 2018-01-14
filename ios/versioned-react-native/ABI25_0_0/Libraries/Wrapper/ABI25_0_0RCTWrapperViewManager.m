// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI25_0_0RCTWrapperViewManager.h"

#import "ABI25_0_0RCTWrapperShadowView.h"
#import "ABI25_0_0RCTWrapperView.h"

@implementation ABI25_0_0RCTWrapperViewManager

ABI25_0_0RCT_EXPORT_MODULE()

- (ABI25_0_0RCTShadowView *)shadowView
{
  return [[ABI25_0_0RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[ABI25_0_0RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
