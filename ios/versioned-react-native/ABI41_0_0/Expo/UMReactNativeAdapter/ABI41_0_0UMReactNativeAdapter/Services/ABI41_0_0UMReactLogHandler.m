// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMReactLogHandler.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMDefines.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

@implementation ABI41_0_0UMReactLogHandler

ABI41_0_0UM_REGISTER_SINGLETON_MODULE(ABI41_0_0ReactLogHandler);

- (void)error:(NSString *)message {
  ABI41_0_0RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  ABI41_0_0RCTFatal(error);
}

- (void)info:(NSString *)message {
  ABI41_0_0RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  ABI41_0_0RCTLogWarn(@"%@", message);
}

@end
