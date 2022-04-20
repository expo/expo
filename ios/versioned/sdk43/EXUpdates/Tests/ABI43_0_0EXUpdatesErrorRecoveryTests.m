//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesErrorRecovery.h>

#import <OCHamcrest/OCHamcrest.h>
#import <OCMockito/OCMockito.h>

@interface ABI43_0_0EXUpdatesErrorRecoveryTests : XCTestCase

@property (nonatomic, strong) ABI43_0_0EXUpdatesErrorRecovery *errorRecovery;
@property (nonatomic, strong) dispatch_queue_t testQueue;

@end

@implementation ABI43_0_0EXUpdatesErrorRecoveryTests

- (void)setUp
{
  _testQueue = dispatch_queue_create("expo.errorRecoveryTestQueue", DISPATCH_QUEUE_SERIAL);
  _errorRecovery = [[ABI43_0_0EXUpdatesErrorRecovery alloc] initWithErrorRecoveryQueue:_testQueue diskWriteQueue:_testQueue remoteLoadTimeout:500];
}

- (void)testHandleError_NewWorkingUpdateAlreadyLoaded
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
  [verifyCount(mockDelegate, never()) throwException:anything()];
}

- (void)testHandleError_NewWorkingUpdateAlreadyLoaded_RCTContentDidAppear
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  [_errorRecovery startMonitoring];
  [[NSNotificationCenter defaultCenter] postNotificationName:@"ABI43_0_0RCTContentDidAppearNotification" object:nil];
  [verify(mockDelegate) markSuccessfulLaunchForLaunchedUpdate];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
  [verify(mockDelegate) throwException:anything()];
}

- (void)testHandleError_NewUpdateLoaded_RelaunchFails
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [self verifyFailedRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
  [verify(mockDelegate) throwException:anything()];
}

// TODO(eric): make these tests less flaky on CI and reenable them
/**
- (void)testHandleError_NewWorkingUpdateLoading
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(^protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate)); // replace ^ with @ when uncommenting
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusLoading];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];
  [_errorRecovery notifyNewRemoteLoadStatus:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
  [verifyCount(mockDelegate, never()) throwException:anything()];
}

- (void)testHandleError_NewWorkingUpdateLoading_RCTContentDidAppear
{
  // should wait a short window for new update to load, then crash
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(^protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate)); // replace ^ with @ when uncommenting
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusLoading];

  [_errorRecovery startMonitoring];
  [[NSNotificationCenter defaultCenter] postNotificationName:@"ABI43_0_0RCTContentDidAppearNotification" object:nil];
  [verify(mockDelegate) markSuccessfulLaunchForLaunchedUpdate];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];

  // make sure we're waiting
  [NSThread sleepForTimeInterval:0.2f];
  dispatch_sync(_testQueue, ^{}); // flush queue
  // don't throw yet!
  [verifyCount(mockDelegate, never()) throwException:anything()];

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];
  [_errorRecovery notifyNewRemoteLoadStatus:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verify(mockDelegate) throwException:anything()];
}
 */

- (void)testHandleError_NewBrokenUpdateLoaded_WorkingUpdateCached
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];

  NSError *mockError2 = mock([NSError class]);
  [_errorRecovery handleError:mockError2];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
  [verifyCount(mockDelegate, never()) throwException:anything()];
}

- (void)testHandleError_NewBrokenUpdateLoaded_UpdateAlreadyLaunchedSuccessfully
{
  // if an update has already been launched successfully, we don't want to fall back to an older update

  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  ABI43_0_0EXUpdatesUpdate *mockUpdate = mock([ABI43_0_0EXUpdatesUpdate class]);
  [given(mockUpdate.successfulLaunchCount) willReturnInteger:1];

  [given(mockDelegate.launchedUpdate) willReturn:mockUpdate];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verifyCount(mockDelegate, never()) markFailedLaunchForLaunchedUpdate];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];

  [given(mockUpdate.successfulLaunchCount) willReturnInteger:0];
  NSError *mockError2 = mock([NSError class]);
  [_errorRecovery handleError:mockError2];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [verify(mockDelegate) throwException:anything()];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:anything()];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
}

// TODO(eric): make these tests less flaky on CI and reenable them
/**
- (void)testHandleError_RemoteLoadTimesOut
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(^protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate)); // replace ^ with @ when uncommenting
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusLoading];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];

  // wait for more than 500ms
  [NSThread sleepForTimeInterval:0.6f];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
  [verifyCount(mockDelegate, never()) throwException:anything()];
}

- (void)testHandleError_RemoteLoadTimesOut_UpdateAlreadyLaunchedSuccessfully
{
  // if an update has already been launched successfully, we don't want to fall back to an older update

  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(^protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate)); // replace ^ with @ when uncommenting
  _errorRecovery.delegate = mockDelegate;

  ABI43_0_0EXUpdatesUpdate *mockUpdate = mock([ABI43_0_0EXUpdatesUpdate class]);
  [given(mockUpdate.successfulLaunchCount) willReturnInteger:1];

  [given(mockDelegate.launchedUpdate) willReturn:mockUpdate];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusLoading];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];

  // wait for more than 500ms
  [NSThread sleepForTimeInterval:0.6f];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) throwException:anything()];
  [verifyCount(mockDelegate, never()) markFailedLaunchForLaunchedUpdate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:anything()];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
}

- (void)testHandleError_RemoteLoadTimesOut_RCTContentDidAppear
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(^protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate)); // replace ^ with @ when uncommenting
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusLoading];

  [_errorRecovery startMonitoring];
  [[NSNotificationCenter defaultCenter] postNotificationName:@"ABI43_0_0RCTContentDidAppearNotification" object:nil];
  [verify(mockDelegate) markSuccessfulLaunchForLaunchedUpdate];

  // if ABI43_0_0RCTContentDidAppear has already fired, we don't want to roll back to an older update
  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];

  // wait for more than 500ms
  [NSThread sleepForTimeInterval:0.6f];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) throwException:anything()];
  [verifyCount(mockDelegate, never()) markFailedLaunchForLaunchedUpdate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:anything()];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
}
 */

- (void)testHandleError_NoRemoteUpdate
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusIdle];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  // should try to load a remote update since we don't have one already
  [verify(mockDelegate) loadRemoteUpdate];

  // indicate there isn't a new update from the server
  [_errorRecovery notifyNewRemoteLoadStatus:ABI43_0_0EXUpdatesRemoteLoadStatusIdle];
  dispatch_sync(_testQueue, ^{}); // flush queue
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
}

- (void)testHandleError_NoRemoteUpdate_RCTContentDidAppear
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusIdle];

  [_errorRecovery startMonitoring];
  [[NSNotificationCenter defaultCenter] postNotificationName:@"ABI43_0_0RCTContentDidAppearNotification" object:nil];
  [verify(mockDelegate) markSuccessfulLaunchForLaunchedUpdate];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  // should try to load a remote update since we don't have one already
  [verify(mockDelegate) loadRemoteUpdate];

  // indicate there isn't a new update from the server
  [_errorRecovery notifyNewRemoteLoadStatus:ABI43_0_0EXUpdatesRemoteLoadStatusIdle];
  dispatch_sync(_testQueue, ^{}); // flush queue
  [verify(mockDelegate) throwException:anything()];
}

- (void)testHandleError_CheckAutomaticallyNever
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  ABI43_0_0EXUpdatesConfig *mockConfig = mock([ABI43_0_0EXUpdatesConfig class]);
  [given(mockConfig.checkOnLaunch) willReturnInteger:ABI43_0_0EXUpdatesCheckAutomaticallyConfigNever];
  [given(mockDelegate.config) willReturn:mockConfig];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusIdle];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
}

- (void)testHandleError_CheckAutomaticallyNever_RCTContentDidAppear
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  ABI43_0_0EXUpdatesConfig *mockConfig = mock([ABI43_0_0EXUpdatesConfig class]);
  [given(mockConfig.checkOnLaunch) willReturnInteger:ABI43_0_0EXUpdatesCheckAutomaticallyConfigNever];
  [given(mockDelegate.config) willReturn:mockConfig];
  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusIdle];

  [_errorRecovery startMonitoring];
  [[NSNotificationCenter defaultCenter] postNotificationName:@"ABI43_0_0RCTContentDidAppearNotification" object:nil];
  [verify(mockDelegate) markSuccessfulLaunchForLaunchedUpdate];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) throwException:anything()];
}

- (void)testHandleTwoErrors
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusIdle];

  NSError *mockError = mock([NSError class]);
  [_errorRecovery handleError:mockError];
  [_errorRecovery handleError:mockError];
  dispatch_sync(_testQueue, ^{}); // flush queue

  // the actual error recovery should only happen once despite there being two errors
  [verifyCount(mockDelegate, times(1)) loadRemoteUpdate];
}

- (void)testHandleException
{
  id<ABI43_0_0EXUpdatesErrorRecoveryDelegate> mockDelegate = mockProtocol(@protocol(ABI43_0_0EXUpdatesErrorRecoveryDelegate));
  _errorRecovery.delegate = mockDelegate;

  [given(mockDelegate.remoteLoadStatus) willReturnInteger:ABI43_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded];

  NSException *mockException = mock([NSException class]);
  [_errorRecovery handleException:mockException];
  dispatch_sync(_testQueue, ^{}); // flush queue

  [verify(mockDelegate) markFailedLaunchForLaunchedUpdate];
  [self verifySuccessfulRelaunchWithCompletion_WithMockDelegate:mockDelegate];
  [verifyCount(mockDelegate, never()) relaunchWithCompletion:(id)anything()];
  [verifyCount(mockDelegate, never()) loadRemoteUpdate];
  [verifyCount(mockDelegate, never()) throwException:anything()];
}

- (void)testConsumeErrorLog
{
  // start with a clean slate
  [ABI43_0_0EXUpdatesErrorRecovery consumeErrorLog];

  NSError *error = [NSError errorWithDomain:@"TestDomain" code:47 userInfo:@{NSLocalizedDescriptionKey: @"TestLocalizedDescription"}];
  [_errorRecovery writeErrorOrExceptionToLog:error];
  dispatch_sync(_testQueue, ^{}); // flush queue

  NSString *errorLog = [ABI43_0_0EXUpdatesErrorRecovery consumeErrorLog];
  XCTAssertTrue([errorLog containsString:@"TestDomain"]);
  XCTAssertTrue([errorLog containsString:@"47"]);
  XCTAssertTrue([errorLog containsString:@"TestLocalizedDescription"]);
}

- (void)testConsumeErrorLog_MultipleErrors
{
  // start with a clean slate
  [ABI43_0_0EXUpdatesErrorRecovery consumeErrorLog];

  NSError *error = [NSError errorWithDomain:@"TestDomain" code:47 userInfo:@{NSLocalizedDescriptionKey: @"TestLocalizedDescription"}];
  [_errorRecovery writeErrorOrExceptionToLog:error];

  NSException *exception = [NSException exceptionWithName:@"TestName" reason:@"TestReason" userInfo:nil];
  [_errorRecovery writeErrorOrExceptionToLog:exception];
  dispatch_sync(_testQueue, ^{}); // flush queue

  NSString *errorLog = [ABI43_0_0EXUpdatesErrorRecovery consumeErrorLog];
  XCTAssertTrue([errorLog containsString:@"TestDomain"]);
  XCTAssertTrue([errorLog containsString:@"47"]);
  XCTAssertTrue([errorLog containsString:@"TestLocalizedDescription"]);
  XCTAssertTrue([errorLog containsString:@"TestName"]);
  XCTAssertTrue([errorLog containsString:@"TestReason"]);
}

- (void)verifySuccessfulRelaunchWithCompletion_WithMockDelegate:(id<ABI43_0_0EXUpdatesErrorRecoveryDelegate>)mockDelegate
{
  HCArgumentCaptor *argument = [[HCArgumentCaptor alloc] init];
  [verify(mockDelegate) relaunchWithCompletion:(id)argument];
  ABI43_0_0EXUpdatesAppLauncherCompletionBlock completion = argument.value;
  completion(nil, YES);
  dispatch_sync(_testQueue, ^{}); // flush queue
}

- (void)verifyFailedRelaunchWithCompletion_WithMockDelegate:(id<ABI43_0_0EXUpdatesErrorRecoveryDelegate>)mockDelegate
{
  HCArgumentCaptor *argument = [[HCArgumentCaptor alloc] init];
  [verify(mockDelegate) relaunchWithCompletion:(id)argument];
  ABI43_0_0EXUpdatesAppLauncherCompletionBlock completion = argument.value;
  completion(mock([NSError class]), NO);
  dispatch_sync(_testQueue, ^{}); // flush queue
}

@end
