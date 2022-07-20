//  Copyright (c) 2022 650 Industries, Inc. All rights reserved.

// This test works locally, but causes compilation to fail
// when built in the iOS unit test CI job, so commented out
// for now.
//
// TODO: fix CI so this test can run

/*
#import <XCTest/XCTest.h>

@interface EXUpdatesLoggerOCTests : XCTestCase

@end

// Headers for the Swift classes and enum
// In application code, EXUpdates-Swift.h can be imported instead

typedef enum {
  EXUpdatesErrorCodeNone = 0,
  EXUpdatesErrorCodeNoUpdatesAvailable = 1,
  EXUpdatesErrorCodeUpdateAssetsNotAvailable = 2,
  EXUpdatesErrorCodeUpdateServerUnreachable = 3,
  EXUpdatesErrorCodeUpdateHasInvalidSignature = 4,
  EXUpdatesErrorCodeUpdateFailedToLoad = 5,
  EXUpdatesErrorCodeAssetsFailedToLoad = 6,
  EXUpdatesErrorCodeJSRuntimeError = 7,
} EXUpdatesErrorCode;

API_AVAILABLE(ios(15.0))
@interface EXUpdatesLogReader : NSObject

- (NSArray * _Nonnull)getLogEntriesNewerThan:(NSDate * _Nonnull)epoch;

@end


API_AVAILABLE(ios(15.0))
@interface EXUpdatesLogger : NSObject

- (void)trace:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code updateId:(NSString * _Nullable)updateId assetId:(NSString * _Nullable)assetId;
- (void)trace:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code;
- (void)debug:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code updateId:(NSString * _Nullable)updateId assetId:(NSString * _Nullable)assetId;
- (void)debug:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code;
- (void)info:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code updateId:(NSString * _Nullable)updateId assetId:(NSString * _Nullable)assetId;
- (void)info:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code;
- (void)warn:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code updateId:(NSString * _Nullable)updateId assetId:(NSString * _Nullable)assetId;
- (void)warn:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code;
- (void)error:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code updateId:(NSString * _Nullable)updateId assetId:(NSString * _Nullable)assetId;
- (void)error:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code;
- (void)fatal:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code updateId:(NSString * _Nullable)updateId assetId:(NSString * _Nullable)assetId;
- (void)fatal:(NSString * _Nonnull)message code:(EXUpdatesErrorCode)code;

@end

API_AVAILABLE(ios(15.0))
@implementation EXUpdatesLoggerOCTests

- (void)test_UpdatesLoggerOCMethods {
  EXUpdatesLogger *logger = [EXUpdatesLogger new];
  EXUpdatesLogReader *logReader = [EXUpdatesLogReader new];

  NSDate *epoch = [NSDate date];

  [logger error:@"Test warning from ObjC code" code:EXUpdatesErrorCodeJSRuntimeError];

  NSArray<NSDictionary *> * logEntries = [logReader getLogEntriesNewerThan:epoch];

  XCTAssertTrue([logEntries count] > 0);

  NSDictionary *logEntry = [logEntries lastObject];

  XCTAssertEqual([[logEntry objectForKey:@"timestamp"] unsignedIntValue], floor([epoch timeIntervalSince1970]));
  XCTAssertEqualObjects([logEntry objectForKey:@"message"], @"Test warning from ObjC code");

  NSArray<NSString *> *stacktrace = [logEntry objectForKey:@"stacktrace"];

  XCTAssertTrue([stacktrace count] > 0);

}

@end
 */
