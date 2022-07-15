// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0React/ABI46_0_0RCTLog.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXReactLogHandler.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>

@implementation ABI46_0_0EXReactLogHandler

ABI46_0_0EX_REGISTER_SINGLETON_MODULE(ABI46_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI46_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI46_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI46_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI46_0_0RCTLogWarn(@"%@", message);
}

@end
