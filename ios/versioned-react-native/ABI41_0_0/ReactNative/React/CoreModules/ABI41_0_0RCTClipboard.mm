/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTClipboard.h"

#import <ABI41_0_0FBReactNativeSpec/ABI41_0_0FBReactNativeSpec.h>
#import <UIKit/UIKit.h>

#import "ABI41_0_0CoreModulesPlugins.h"

using namespace ABI41_0_0facebook::ABI41_0_0React;

@interface ABI41_0_0RCTClipboard () <ABI41_0_0NativeClipboardSpec>
@end

@implementation ABI41_0_0RCTClipboard

ABI41_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI41_0_0RCT_EXPORT_METHOD(setString : (NSString *)content)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ?: @"");
}

ABI41_0_0RCT_EXPORT_METHOD(getString : (ABI41_0_0RCTPromiseResolveBlock)resolve reject : (__unused ABI41_0_0RCTPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ?: @""));
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
                                              nativeInvoker:(std::shared_ptr<CallInvoker>)nativeInvoker
                                                 perfLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<NativeClipboardSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI41_0_0RCTClipboardCls(void)
{
  return ABI41_0_0RCTClipboard.class;
}
