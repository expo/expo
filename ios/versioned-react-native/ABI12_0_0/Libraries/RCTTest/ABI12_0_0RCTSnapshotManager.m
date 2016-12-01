/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTSnapshotManager.h"

@interface ABI12_0_0RCTSnapshotView : UIView

@property (nonatomic, copy) ABI12_0_0RCTDirectEventBlock onSnapshotReady;
@property (nonatomic, copy) NSString *testIdentifier;

@end

@implementation ABI12_0_0RCTSnapshotView

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


@implementation ABI12_0_0RCTSnapshotManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI12_0_0RCTSnapshotView new];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(testIdentifier, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onSnapshotReady, ABI12_0_0RCTDirectEventBlock)

@end
