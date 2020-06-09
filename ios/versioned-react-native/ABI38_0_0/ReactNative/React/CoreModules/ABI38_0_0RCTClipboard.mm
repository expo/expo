/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTClipboard.h"

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import <UIKit/UIKit.h>

#import "ABI38_0_0CoreModulesPlugins.h"

using namespace ABI38_0_0facebook::ABI38_0_0React;

@interface ABI38_0_0RCTClipboard () <NativeClipboardSpec>
@end

@implementation ABI38_0_0RCTClipboard

ABI38_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI38_0_0RCT_EXPORT_METHOD(setString:(NSString *)content)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

ABI38_0_0RCT_EXPORT_METHOD(getString:(ABI38_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI38_0_0RCTPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ? : @""));
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return std::make_shared<NativeClipboardSpecJSI>(self, jsInvoker);
}

@end

Class ABI38_0_0RCTClipboardCls(void) {
  return ABI38_0_0RCTClipboard.class;
}
