// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMReactNativeAdapter/ABI34_0_0UMReactLogHandler.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMDefines.h>
#import <ReactABI34_0_0/ABI34_0_0RCTLog.h>

@implementation ABI34_0_0UMReactLogHandler

ABI34_0_0UM_REGISTER_SINGLETON_MODULE(ReactABI34_0_0LogHandler);

- (void)error:(NSString *)message {
  ABI34_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI34_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI34_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI34_0_0RCTLogWarn(@"%@", message);
}

@end
