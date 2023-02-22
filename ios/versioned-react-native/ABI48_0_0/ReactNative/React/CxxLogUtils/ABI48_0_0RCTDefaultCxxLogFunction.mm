/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTDefaultCxxLogFunction.h"
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>
#import <glog/logging.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

void ABI48_0_0RCTDefaultCxxLogFunction(ABI48_0_0ReactNativeLogLevel level, const char *message)
{
  NSString *messageString = [NSString stringWithUTF8String:message];

  switch (level) {
    case ABI48_0_0ReactNativeLogLevelInfo:
      LOG(INFO) << message;
      ABI48_0_0RCTLogInfo(@"%@", messageString);
      break;
    case ABI48_0_0ReactNativeLogLevelWarning:
      LOG(WARNING) << message;
      ABI48_0_0RCTLogWarn(@"%@", messageString);
      break;
    case ABI48_0_0ReactNativeLogLevelError:
      LOG(ERROR) << message;
      ABI48_0_0RCTLogError(@"%@", messageString);
      break;
    case ABI48_0_0ReactNativeLogLevelFatal:
      LOG(FATAL) << message;
      break;
  }
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
