// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMReactNativeAdapter/ABI36_0_0UMReactLogHandler.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMDefines.h>
#import <ABI36_0_0React/ABI36_0_0RCTLog.h>

@implementation ABI36_0_0UMReactLogHandler

ABI36_0_0UM_REGISTER_SINGLETON_MODULE(ABI36_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI36_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI36_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI36_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI36_0_0RCTLogWarn(@"%@", message);
}

@end
