// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelUtil.h"
#import "EXLog.h"

RCTLogFunction EXDefaultRCTLogFunction = ^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
  switch (level) {
    case RCTLogLevelTrace:
      DDLogDebug(@"%@", message);
      break;
    case RCTLogLevelInfo:
      DDLogInfo(@"%@", message);
      break;
    case RCTLogLevelWarning:
      DDLogWarn(@"%@", message);
      break;
    case RCTLogLevelError:
    case RCTLogLevelFatal:
      DDLogError(@"%@", message);
      break;
  }
};

RCTLogFunction EXDeveloperRCTLogFunction = ^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
  DDLogError(@"%@", RCTFormatLog([NSDate date], level, fileName, lineNumber, message));
};

RCTLogFunction EXGetKernelRCTLogFunction() {
#if DEBUG
  return EXDeveloperRCTLogFunction;
#else
  return EXDefaultRCTLogFunction;
#endif
}
