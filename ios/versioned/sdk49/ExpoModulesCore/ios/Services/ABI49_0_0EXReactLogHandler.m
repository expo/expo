// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0React/ABI49_0_0RCTLog.h>

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXReactLogHandler.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXDefines.h>

@implementation ABI49_0_0EXReactLogHandler

ABI49_0_0EX_REGISTER_SINGLETON_MODULE(ABI49_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI49_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI49_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI49_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI49_0_0RCTLogWarn(@"%@", message);
}

@end
