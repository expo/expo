// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMReactNativeAdapter/ABI42_0_0UMReactLogHandler.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>

@implementation ABI42_0_0UMReactLogHandler

ABI42_0_0UM_REGISTER_SINGLETON_MODULE(ABI42_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI42_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI42_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI42_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI42_0_0RCTLogWarn(@"%@", message);
}

@end
