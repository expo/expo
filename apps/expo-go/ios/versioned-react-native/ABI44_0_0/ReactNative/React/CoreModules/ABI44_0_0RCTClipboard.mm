/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTClipboard.h"

#import <ABI44_0_0FBReactNativeSpec/ABI44_0_0FBReactNativeSpec.h>
#import <UIKit/UIKit.h>

#import "ABI44_0_0CoreModulesPlugins.h"

using namespace ABI44_0_0facebook::ABI44_0_0React;

@interface ABI44_0_0RCTClipboard () <ABI44_0_0NativeClipboardSpec>
@end

@implementation ABI44_0_0RCTClipboard

ABI44_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI44_0_0RCT_EXPORT_METHOD(setString : (NSString *)content)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ?: @"");
}

ABI44_0_0RCT_EXPORT_METHOD(getString : (ABI44_0_0RCTPromiseResolveBlock)resolve reject : (__unused ABI44_0_0RCTPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ?: @""));
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeClipboardSpecJSI>(params);
}

@end

Class ABI44_0_0RCTClipboardCls(void)
{
  return ABI44_0_0RCTClipboard.class;
}
