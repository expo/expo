// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMReactLogHandler.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMDefines.h>
#import <ReactABI33_0_0/ABI33_0_0RCTLog.h>

@implementation ABI33_0_0UMReactLogHandler

ABI33_0_0UM_REGISTER_SINGLETON_MODULE(ReactABI33_0_0LogHandler);

- (void)error:(NSString *)message {
  ABI33_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI33_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI33_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI33_0_0RCTLogWarn(@"%@", message);
}

@end
