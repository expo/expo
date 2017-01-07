/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTAdSupport.h"

#import <AdSupport/ASIdentifierManager.h>

#import <ReactABI13_0_0/ABI13_0_0RCTUtils.h>

@implementation ABI13_0_0RCTAdSupport

ABI13_0_0RCT_EXPORT_MODULE()

ABI13_0_0RCT_EXPORT_METHOD(getAdvertisingId:(ABI13_0_0RCTResponseSenderBlock)callback
                  withErrorCallback:(ABI13_0_0RCTResponseErrorBlock)errorCallback)
{
  NSUUID *advertisingIdentifier = [ASIdentifierManager sharedManager].advertisingIdentifier;
  if (advertisingIdentifier) {
    callback(@[advertisingIdentifier.UUIDString]);
  } else {
    errorCallback(ABI13_0_0RCTErrorWithMessage(@"Advertising identifier is unavailable."));
  }
}

ABI13_0_0RCT_EXPORT_METHOD(getAdvertisingTrackingEnabled:(ABI13_0_0RCTResponseSenderBlock)callback
                  withErrorCallback:(__unused ABI13_0_0RCTResponseSenderBlock)errorCallback)
{
  callback(@[@([ASIdentifierManager sharedManager].advertisingTrackingEnabled)]);
}

@end
