// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTExceptionsManager.h>
#import <React/RCTAssert.h>

@class EXKernelAppRecord;

extern RCTFatalHandler handleFatalReactError;

@interface EXReactAppExceptionHandler : NSObject <RCTExceptionsManagerDelegate>

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)appRecord NS_DESIGNATED_INITIALIZER;

@end
