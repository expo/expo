/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTSafeAreaView.h"

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>

#import "ABI42_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI42_0_0RCTSafeAreaView {
  __weak ABI42_0_0RCTBridge *_bridge;
  UIEdgeInsets _currentSafeAreaInsets;
}

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
{
  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    _emulateUnlessSupported = YES; // The default.
  }

  return self;
}

ABI42_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)decoder)
ABI42_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

  return [NSString stringWithFormat:@"%@; safeAreaInsets = %@; appliedSafeAreaInsets = %@>",
                                    superDescription,
                                    NSStringFromUIEdgeInsets([self safeAreaInsetsIfSupportedAndEnabled]),
                                    NSStringFromUIEdgeInsets(_currentSafeAreaInsets)];
}

- (BOOL)isSupportedByOS
{
  return [self respondsToSelector:@selector(safeAreaInsets)];
}

- (UIEdgeInsets)safeAreaInsetsIfSupportedAndEnabled
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
  if (self.isSupportedByOS) {
    if (@available(iOS 11.0, *)) {
      return self.safeAreaInsets;
    }
  }
#endif
  return self.emulateUnlessSupported ? self.emulatedSafeAreaInsets : UIEdgeInsetsZero;
}

- (UIEdgeInsets)emulatedSafeAreaInsets
{
  UIViewController *vc = self.ABI42_0_0ReactViewController;

  if (!vc) {
    return UIEdgeInsetsZero;
  }

  CGFloat topLayoutOffset = vc.topLayoutGuide.length;
  CGFloat bottomLayoutOffset = vc.bottomLayoutGuide.length;
  CGRect safeArea = vc.view.bounds;
  safeArea.origin.y += topLayoutOffset;
  safeArea.size.height -= topLayoutOffset + bottomLayoutOffset;
  CGRect localSafeArea = [vc.view convertRect:safeArea toView:self];
  UIEdgeInsets safeAreaInsets = UIEdgeInsetsMake(0, 0, 0, 0);
  if (CGRectGetMinY(localSafeArea) > CGRectGetMinY(self.bounds)) {
    safeAreaInsets.top = CGRectGetMinY(localSafeArea) - CGRectGetMinY(self.bounds);
  }
  if (CGRectGetMaxY(localSafeArea) < CGRectGetMaxY(self.bounds)) {
    safeAreaInsets.bottom = CGRectGetMaxY(self.bounds) - CGRectGetMaxY(localSafeArea);
  }

  return safeAreaInsets;
}

static BOOL UIEdgeInsetsEqualToEdgeInsetsWithThreshold(UIEdgeInsets insets1, UIEdgeInsets insets2, CGFloat threshold)
{
  return ABS(insets1.left - insets2.left) <= threshold && ABS(insets1.right - insets2.right) <= threshold &&
      ABS(insets1.top - insets2.top) <= threshold && ABS(insets1.bottom - insets2.bottom) <= threshold;
}

- (void)safeAreaInsetsDidChange
{
  [self invalidateSafeAreaInsets];
}

- (void)invalidateSafeAreaInsets
{
  [self setSafeAreaInsets:self.safeAreaInsetsIfSupportedAndEnabled];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  if (!self.isSupportedByOS && self.emulateUnlessSupported) {
    [self invalidateSafeAreaInsets];
  }
}

- (void)setSafeAreaInsets:(UIEdgeInsets)safeAreaInsets
{
  if (UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / ABI42_0_0RCTScreenScale())) {
    return;
  }

  _currentSafeAreaInsets = safeAreaInsets;

  ABI42_0_0RCTSafeAreaViewLocalData *localData = [[ABI42_0_0RCTSafeAreaViewLocalData alloc] initWithInsets:safeAreaInsets];
  [_bridge.uiManager setLocalData:localData forView:self];
}

- (void)setEmulateUnlessSupported:(BOOL)emulateUnlessSupported
{
  if (_emulateUnlessSupported == emulateUnlessSupported) {
    return;
  }

  _emulateUnlessSupported = emulateUnlessSupported;

  if ([self isSupportedByOS]) {
    return;
  }

  [self invalidateSafeAreaInsets];
}

@end
