//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesErrorRecovery.h>

#import <OCHamcrest/OCHamcrest.h>
#import <OCMockito/OCMockito.h>

@interface EXUpdatesErrorRecoveryTests : XCTestCase

@property (nonatomic, strong) EXUpdatesErrorRecovery *errorRecovery;
@property (nonatomic, strong) dispatch_queue_t testQueue;
@property (nonatomic, strong) EXUpdatesDatabase *mockDatabase;

@end

@implementation EXUpdatesErrorRecoveryTests

- (void)setUp
{
  _testQueue = dispatch_queue_create("expo.errorRecoveryTestQueue", DISPATCH_QUEUE_SERIAL);
  _errorRecovery = [[EXUpdatesErrorRecovery alloc] initWithErrorRecoveryQueue:_testQueue diskWriteQueue:_testQueue remoteLoadTimeout:500];
  _mockDatabase = mock([EXUpdatesDatabase class]);
  [given(_mockDatabase.databaseQueue) willReturn:_testQueue];
}

- (void)tearDown
{
  // Put teardown code here. This method is called after the invocation of each test method in the class.
}

- (void)testHandleError_NewWorkingUpdateAlreadyLoaded
{
  id<EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.database) willReturn:_mockDatabase];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) relaunchUsingEmbeddedUpdate];
}

- (void)testHandleError_NewWorkingUpdateLoading
{
  id<EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.database) willReturn:_mockDatabase];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusLoading];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError fromLaunchedUpdate:mock([EXUpdatesUpdate class])];

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusNewUpdateLoaded];
  [_errorRecovery notifyNewRemoteLoadStatus:EXUpdatesRemoteLoadStatusNewUpdateLoaded];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) relaunchUsingEmbeddedUpdate];
}

- (void)testHandleError_NewBrokenUpdateLoaded_WorkingUpdateCached
{
  id<EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.database) willReturn:_mockDatabase];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];

  NSError *mockError2 = mock([NSError class]);
  [_errorRecovery handleError:mockError2 fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchUsingEmbeddedUpdate];
}

- (void)testHandleError_NewBrokenUpdateLoaded_BrokenUpdateCached
{
  id<EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.database) willReturn:_mockDatabase];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusNewUpdateLoaded];
  [given([mockDelegate relaunchUsingEmbeddedUpdate]) willReturnBool:YES];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];

  NSError *mockError2 = mock([NSError class]);
  [_errorRecovery handleError:mockError2 fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];

  NSError *mockError3 = mock([NSError class]);
  [_errorRecovery handleError:mockError3 fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [verify(mockDelegate) relaunchUsingEmbeddedUpdate];
}

- (void)testHandleError_RemoteLoadTimesOut
{
  id<EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.database) willReturn:_mockDatabase];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusLoading];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError fromLaunchedUpdate:mock([EXUpdatesUpdate class])];

  // wait for more than 500ms
  [NSThread sleepForTimeInterval:0.6f];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) relaunchUsingEmbeddedUpdate];
}

- (void)testHandleError_NoRemoteUpdate
{
  id<EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.database) willReturn:_mockDatabase];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusIdle];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) relaunchUsingEmbeddedUpdate];
}

- (void)testHandleError_RelaunchFails
{
  id<EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.database) willReturn:_mockDatabase];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusNewUpdateLoaded];
  [given([mockDelegate relaunchUsingEmbeddedUpdate]) willReturnBool:YES];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];

  [self verifyFailedRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  // we should fall back to the embedded update
  [verify(mockDelegate) relaunchUsingEmbeddedUpdate];
}

- (void)testHandleException
{
  id<EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.database) willReturn:_mockDatabase];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  NSException *mockException = mock([NSException class]);
  [_errorRecovery handleException:mockException fromLaunchedUpdate:mock([EXUpdatesUpdate class])];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [self verifyDatabaseMarkUpdateFailed];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) relaunchUsingEmbeddedUpdate];
}

- (void)testConsumeErrorLog
{
  // start with a clean slate
  [EXUpdatesErrorRecovery consumeErrorLog];

  NSError *error = [NSError errorWithDomain:@"TestDomain" code:47 userInfo:@{NSLocalizedDescriptionKey: @"TestLocalizedDescription"}];
  [_errorRecovery writeErrorOrExceptionToLog:error];
  dispatch_sync(_testQueue, ^{}); // flush queue

  NSString *errorLog = [EXUpdatesErrorRecovery consumeErrorLog];
  XCTAssertTrue([errorLog containsString:@"TestDomain"]);
  XCTAssertTrue([errorLog containsString:@"47"]);
  XCTAssertTrue([errorLog containsString:@"TestLocalizedDescription"]);
}

- (void)testConsumeErrorLog_MultipleErrors
{
  // start with a clean slate
  [EXUpdatesErrorRecovery consumeErrorLog];

  NSError *error = [NSError errorWithDomain:@"TestDomain" code:47 userInfo:@{NSLocalizedDescriptionKey: @"TestLocalizedDescription"}];
  [_errorRecovery writeErrorOrExceptionToLog:error];

  NSException *exception = [NSException exceptionWithName:@"TestName" reason:@"TestReason" userInfo:nil];
  [_errorRecovery writeErrorOrExceptionToLog:exception];
  dispatch_sync(_testQueue, ^{}); // flush queue

  NSString *errorLog = [EXUpdatesErrorRecovery consumeErrorLog];
  XCTAssertTrue([errorLog containsString:@"TestDomain"]);
  XCTAssertTrue([errorLog containsString:@"47"]);
  XCTAssertTrue([errorLog containsString:@"TestLocalizedDescription"]);
  XCTAssertTrue([errorLog containsString:@"TestName"]);
  XCTAssertTrue([errorLog containsString:@"TestReason"]);
}

- (void)verifySuccessfulRelaunchWithCompletion_WithMockDelegate:(id<EXUpdatesErrorRecoveryDelegate>)mockDelegate
{
  HCArgumentCaptor *argument = [[HCArgumentCaptor alloc] init];
  [verify(mockDelegate) relaunchWithCompletion:(id)argument];
  EXUpdatesAppLauncherCompletionBlock completion = argument.value;
  completion(nil, YES);
  dispatch_sync(_testQueue, ^{}); // flush queue
}

- (void)verifyFailedRelaunchWithCompletion_WithMockDelegate:(id<EXUpdatesErrorRecoveryDelegate>)mockDelegate
{
  HCArgumentCaptor *argument = [[HCArgumentCaptor alloc] init];
  [verify(mockDelegate) relaunchWithCompletion:(id)argument];
  EXUpdatesAppLauncherCompletionBlock completion = argument.value;
  completion(mock([NSError class]), NO);
  dispatch_sync(_testQueue, ^{}); // flush queue
}

- (void)verifyDatabaseMarkUpdateFailed
{
  NSError *err;
  [[verify(_mockDatabase) withMatcher:anything() forArgument:1] markUpdateFailed:anything() error:&err];
}

@end
