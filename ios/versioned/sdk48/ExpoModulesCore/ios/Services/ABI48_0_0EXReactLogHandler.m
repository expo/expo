// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0React/ABI48_0_0RCTLog.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXReactLogHandler.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXDefines.h>

@implementation ABI48_0_0EXReactLogHandler

ABI48_0_0EX_REGISTER_SINGLETON_MODULE(ABI48_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI48_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI48_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI48_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI48_0_0RCTLogWarn(@"%@", message);
}

@end
