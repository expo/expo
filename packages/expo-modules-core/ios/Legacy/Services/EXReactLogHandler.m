// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTLog.h>
#import <React/RCTAssert.h>

#import <ExpoModulesCore/EXReactLogHandler.h>
#import <ExpoModulesCore/EXDefines.h>

@implementation EXReactLogHandler

EX_REGISTER_SINGLETON_MODULE(ReactLogHandler);

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
