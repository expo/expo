// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMReactNativeAdapter/UMReactLogHandler.h>
#import <UMCore/UMDefines.h>
#import <React/RCTLog.h>

@implementation UMReactLogHandler

UM_REGISTER_SINGLETON_MODULE(ReactLogHandler);

- (void)error:(NSString *)message {
  RCTLogError(@"%@", message);
}

- (void)fatal:(NSError *)error {
  RCTFatal(error);
}

- (void)info:(NSString *)message {
  RCTLogInfo(@"%@", message);
}

- (void)warn:(NSString *)message {
  RCTLogWarn(@"%@", message);
}

@end
