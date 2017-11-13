/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>
#import <ReactABI23_0_0/ABI23_0_0RCTErrorCustomizer.h>

@class ABI23_0_0RCTJSStackFrame;

@interface ABI23_0_0RCTRedBox : NSObject <ABI23_0_0RCTBridgeModule>

- (void)registerErrorCustomizer:(id<ABI23_0_0RCTErrorCustomizer>)errorCustomizer;
- (void)showError:(NSError *)error;
- (void)showErrorMessage:(NSString *)message;
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details;
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack;
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<ABI23_0_0RCTJSStackFrame *> *)stack;
- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<ABI23_0_0RCTJSStackFrame *> *)stack;

- (void)dismiss;

/** Overrides bridge.bundleURL. Modify on main thread only. You shouldn't need to use this. */
@property (nonatomic, strong) NSURL *overrideBundleURL;

/** Overrides the default behavior of calling [bridge reload] on reload. You shouldn't need to use this. */
@property (nonatomic, strong) dispatch_block_t overrideReloadAction;

@end

/**
 * This category makes the red box instance available via the ABI23_0_0RCTBridge, which
 * is useful for any class that needs to access the red box or error log.
 */
@interface ABI23_0_0RCTBridge (ABI23_0_0RCTRedBox)

@property (nonatomic, readonly) ABI23_0_0RCTRedBox *redBox;

@end
