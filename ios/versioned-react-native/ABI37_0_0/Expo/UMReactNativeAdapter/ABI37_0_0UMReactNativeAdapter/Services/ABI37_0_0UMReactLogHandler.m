// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMReactLogHandler.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMDefines.h>
#import <ABI37_0_0React/ABI37_0_0RCTLog.h>

@implementation ABI37_0_0UMReactLogHandler

ABI37_0_0UM_REGISTER_SINGLETON_MODULE(ABI37_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI37_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI37_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI37_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI37_0_0RCTLogWarn(@"%@", message);
}

@end
