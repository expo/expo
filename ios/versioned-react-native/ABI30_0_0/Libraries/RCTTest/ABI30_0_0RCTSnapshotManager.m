/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTSnapshotManager.h"

@interface ABI30_0_0RCTSnapshotView : UIView

@property (nonatomic, copy) ABI30_0_0RCTDirectEventBlock onSnapshotReady;
@property (nonatomic, copy) NSString *testIdentifier;

@end

@implementation ABI30_0_0RCTSnapshotView

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


@implementation ABI30_0_0RCTSnapshotManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI30_0_0RCTSnapshotView new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(testIdentifier, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onSnapshotReady, ABI30_0_0RCTDirectEventBlock)

@end
