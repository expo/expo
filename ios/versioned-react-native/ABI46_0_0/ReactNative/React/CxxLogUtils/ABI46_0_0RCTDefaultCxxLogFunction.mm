/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTDefaultCxxLogFunction.h"
#import <ABI46_0_0React/ABI46_0_0RCTLog.h>
#import <glog/logging.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

void ABI46_0_0RCTDefaultCxxLogFunction(ABI46_0_0ReactNativeLogLevel level, const char *message)
{
  NSString *messageString = [NSString stringWithUTF8String:message];

  switch (level) {
    case ABI46_0_0ReactNativeLogLevelInfo:
      LOG(INFO) << message;
      ABI46_0_0RCTLogInfo(@"%@", messageString);
      break;
    case ABI46_0_0ReactNativeLogLevelWarning:
      LOG(WARNING) << message;
      ABI46_0_0RCTLogWarn(@"%@", messageString);
      break;
    case ABI46_0_0ReactNativeLogLevelError:
      LOG(ERROR) << message;
      ABI46_0_0RCTLogError(@"%@", messageString);
      break;
    case ABI46_0_0ReactNativeLogLevelFatal:
      LOG(FATAL) << message;
      break;
  }
}

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
