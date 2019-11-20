// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMReactNativeAdapter/ABI35_0_0UMReactLogHandler.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMDefines.h>
#import <ReactABI35_0_0/ABI35_0_0RCTLog.h>

@implementation ABI35_0_0UMReactLogHandler

ABI35_0_0UM_REGISTER_SINGLETON_MODULE(ReactABI35_0_0LogHandler);

- (void)error:(NSString *)message {
  ABI35_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI35_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI35_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI35_0_0RCTLogWarn(@"%@", message);
}

@end
