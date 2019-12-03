/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTWebViewManager.h"

#import "ABI34_0_0RCTBridge.h"
#import "ABI34_0_0RCTUIManager.h"
#import "UIView+ReactABI34_0_0.h"

@interface ABI34_0_0RCTWebViewManager ()

@end

@implementation ABI34_0_0RCTWebViewManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI34_0_0RCTLogWarn(@"RCTWebView had to be removed from SDK35-compatible "
                      "Expo Client in order to comply with latest App Review"
                      "guidelines. Plain empty view will be rendered instead.");
  return [[UIView alloc] initWithFrame:CGRectZero];
}

ABI34_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
}

ABI34_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
}

ABI34_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
}

ABI34_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
}

ABI34_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI34_0_0Tag message:(NSString *)message)
{
}

ABI34_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI34_0_0Tag script:(NSString *)script)
{
}

ABI34_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
}

@end
