// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTLog.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXReactLogHandler.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>

@implementation ABI47_0_0EXReactLogHandler

ABI47_0_0EX_REGISTER_SINGLETON_MODULE(ABI47_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI47_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI47_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI47_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI47_0_0RCTLogWarn(@"%@", message);
}

@end
