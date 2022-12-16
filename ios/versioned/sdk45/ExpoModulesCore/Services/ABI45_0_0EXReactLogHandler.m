// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0React/ABI45_0_0RCTLog.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXReactLogHandler.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDefines.h>

@implementation ABI45_0_0EXReactLogHandler

ABI45_0_0EX_REGISTER_SINGLETON_MODULE(ABI45_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI45_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI45_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI45_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI45_0_0RCTLogWarn(@"%@", message);
}

@end
