// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMReactNativeAdapter/ABI39_0_0UMReactLogHandler.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMDefines.h>
#import <ABI39_0_0React/ABI39_0_0RCTLog.h>

@implementation ABI39_0_0UMReactLogHandler

ABI39_0_0UM_REGISTER_SINGLETON_MODULE(ABI39_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI39_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI39_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI39_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI39_0_0RCTLogWarn(@"%@", message);
}

@end
