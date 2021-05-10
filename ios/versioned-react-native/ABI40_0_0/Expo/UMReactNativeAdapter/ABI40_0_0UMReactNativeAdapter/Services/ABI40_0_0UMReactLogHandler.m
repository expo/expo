// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMReactLogHandler.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMDefines.h>
#import <ABI40_0_0React/ABI40_0_0RCTLog.h>

@implementation ABI40_0_0UMReactLogHandler

ABI40_0_0UM_REGISTER_SINGLETON_MODULE(ABI40_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI40_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI40_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI40_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI40_0_0RCTLogWarn(@"%@", message);
}

@end
