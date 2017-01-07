/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTClipboard.h"

#import "ABI13_0_0RCTUtils.h"

#import <UIKit/UIKit.h>

@implementation ABI13_0_0RCTClipboard

ABI13_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI13_0_0RCT_EXPORT_METHOD(setString:(NSString *)content)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

ABI13_0_0RCT_EXPORT_METHOD(getString:(ABI13_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI13_0_0RCTPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  resolve((clipboard.string ? : @""));
}

@end
