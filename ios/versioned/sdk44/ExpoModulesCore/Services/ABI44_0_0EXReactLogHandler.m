// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0React/ABI44_0_0RCTLog.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXReactLogHandler.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>

@implementation ABI44_0_0EXReactLogHandler

ABI44_0_0EX_REGISTER_SINGLETON_MODULE(ABI44_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI44_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI44_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI44_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI44_0_0RCTLogWarn(@"%@", message);
}

@end
