// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI24_0_0RCTWrapperViewManager.h"

#import "ABI24_0_0RCTWrapperShadowView.h"
#import "ABI24_0_0RCTWrapperView.h"

@implementation ABI24_0_0RCTWrapperViewManager

ABI24_0_0RCT_EXPORT_MODULE()

- (ABI24_0_0RCTShadowView *)shadowView
{
  return [[ABI24_0_0RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[ABI24_0_0RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end
