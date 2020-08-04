// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMReactLogHandler.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMDefines.h>
#import <ABI38_0_0React/ABI38_0_0RCTLog.h>

@implementation ABI38_0_0UMReactLogHandler

ABI38_0_0UM_REGISTER_SINGLETON_MODULE(ABI38_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI38_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI38_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI38_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI38_0_0RCTLogWarn(@"%@", message);
}

@end
