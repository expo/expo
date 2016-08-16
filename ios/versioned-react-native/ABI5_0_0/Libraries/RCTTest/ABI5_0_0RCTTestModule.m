/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTTestModule.h"

#import "ABI5_0_0FBSnapshotTestController.h"
#import "ABI5_0_0RCTAssert.h"
#import "ABI5_0_0RCTEventDispatcher.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTUIManager.h"

@implementation ABI5_0_0RCTTestModule
{
  NSMutableDictionary<NSString *, NSString *> *_snapshotCounter;
}

@synthesize bridge = _bridge;

ABI5_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return _bridge.uiManager.methodQueue;
}

ABI5_0_0RCT_EXPORT_METHOD(verifySnapshot:(ABI5_0_0RCTResponseSenderBlock)callback)
{
  ABI5_0_0RCTAssert(_controller != nil, @"No snapshot controller configured.");

  [_bridge.uiManager addUIBlock:^(ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    NSString *testName = NSStringFromSelector(_testSelector);
    if (!_snapshotCounter) {
      _snapshotCounter = [NSMutableDictionary new];
    }
    _snapshotCounter[testName] = (@([_snapshotCounter[testName] integerValue] + 1)).stringValue;

    NSError *error = nil;
    BOOL success = [_controller compareSnapshotOfView:_view
                                             selector:_testSelector
                                           identifier:_snapshotCounter[testName]
                                                error:&error];
    callback(@[@(success)]);
  }];
}

ABI5_0_0RCT_EXPORT_METHOD(sendAppEvent:(NSString *)name body:(nullable id)body)
{
  [_bridge.eventDispatcher sendAppEventWithName:name body:body];
}

ABI5_0_0RCT_REMAP_METHOD(shouldResolve, shouldResolve_resolve:(ABI5_0_0RCTPromiseResolveBlock)resolve reject:(ABI5_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@1);
}

ABI5_0_0RCT_REMAP_METHOD(shouldReject, shouldReject_resolve:(ABI5_0_0RCTPromiseResolveBlock)resolve reject:(ABI5_0_0RCTPromiseRejectBlock)reject)
{
  reject(nil, nil, nil);
}

ABI5_0_0RCT_EXPORT_METHOD(markTestCompleted)
{
  [self markTestPassed:YES];
}

ABI5_0_0RCT_EXPORT_METHOD(markTestPassed:(BOOL)success)
{
  [_bridge.uiManager addUIBlock:^(__unused ABI5_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _status = success ? ABI5_0_0RCTTestStatusPassed : ABI5_0_0RCTTestStatusFailed;
  }];
}

@end
