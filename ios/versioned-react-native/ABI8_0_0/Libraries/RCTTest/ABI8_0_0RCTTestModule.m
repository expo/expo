/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTTestModule.h"

#import "ABI8_0_0FBSnapshotTestController.h"
#import "ABI8_0_0RCTAssert.h"
#import "ABI8_0_0RCTEventDispatcher.h"
#import "ABI8_0_0RCTLog.h"
#import "ABI8_0_0RCTUIManager.h"

@implementation ABI8_0_0RCTTestModule
{
  NSMutableDictionary<NSString *, NSString *> *_snapshotCounter;
}

@synthesize bridge = _bridge;

ABI8_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return _bridge.uiManager.methodQueue;
}

ABI8_0_0RCT_EXPORT_METHOD(verifySnapshot:(ABI8_0_0RCTResponseSenderBlock)callback)
{
  ABI8_0_0RCTAssert(_controller != nil, @"No snapshot controller configured.");

  [_bridge.uiManager addUIBlock:^(ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    NSString *testName = NSStringFromSelector(self->_testSelector);
    if (!self->_snapshotCounter) {
      self->_snapshotCounter = [NSMutableDictionary new];
    }
    self->_snapshotCounter[testName] = (@([self->_snapshotCounter[testName] integerValue] + 1)).stringValue;

    NSError *error = nil;
    BOOL success = [self->_controller compareSnapshotOfView:self->_view
                                             selector:self->_testSelector
                                           identifier:self->_snapshotCounter[testName]
                                                error:&error];
    callback(@[@(success)]);
  }];
}

ABI8_0_0RCT_EXPORT_METHOD(sendAppEvent:(NSString *)name body:(nullable id)body)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendAppEventWithName:name body:body];
#pragma clang diagnostic pop
}

ABI8_0_0RCT_REMAP_METHOD(shouldResolve, shouldResolve_resolve:(ABI8_0_0RCTPromiseResolveBlock)resolve reject:(ABI8_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@1);
}

ABI8_0_0RCT_REMAP_METHOD(shouldReject, shouldReject_resolve:(ABI8_0_0RCTPromiseResolveBlock)resolve reject:(ABI8_0_0RCTPromiseRejectBlock)reject)
{
  reject(nil, nil, nil);
}

ABI8_0_0RCT_EXPORT_METHOD(markTestCompleted)
{
  [self markTestPassed:YES];
}

ABI8_0_0RCT_EXPORT_METHOD(markTestPassed:(BOOL)success)
{
  [_bridge.uiManager addUIBlock:^(__unused ABI8_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    self->_status = success ? ABI8_0_0RCTTestStatusPassed : ABI8_0_0RCTTestStatusFailed;
  }];
}

@end
