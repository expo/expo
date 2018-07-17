/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>

@class ABI29_0_0RCTLoadingProgress;

@interface ABI29_0_0RCTDevLoadingView : NSObject <ABI29_0_0RCTBridgeModule>

+ (void)setEnabled:(BOOL)enabled;
- (void)showWithURL:(NSURL *)URL;
- (void)updateProgress:(ABI29_0_0RCTLoadingProgress *)progress;
- (void)hide;

@end
