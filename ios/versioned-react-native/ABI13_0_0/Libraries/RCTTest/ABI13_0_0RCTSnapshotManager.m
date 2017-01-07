/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTSnapshotManager.h"

@interface ABI13_0_0RCTSnapshotView : UIView

@property (nonatomic, copy) ABI13_0_0RCTDirectEventBlock onSnapshotReady;
@property (nonatomic, copy) NSString *testIdentifier;

@end

@implementation ABI13_0_0RCTSnapshotView

- (void)setTestIdentifier:(NSString *)testIdentifier
{
  if (![_testIdentifier isEqualToString:testIdentifier]) {
    _testIdentifier = [testIdentifier copy];
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onSnapshotReady) {
        self.onSnapshotReady(@{@"testIdentifier" : self.testIdentifier});
      }
    });
  }
}

@end


@implementation ABI13_0_0RCTSnapshotManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI13_0_0RCTSnapshotView new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(testIdentifier, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onSnapshotReady, ABI13_0_0RCTDirectEventBlock)

@end
