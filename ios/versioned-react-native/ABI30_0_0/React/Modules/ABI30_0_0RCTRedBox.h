/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>
#import <ReactABI30_0_0/ABI30_0_0RCTErrorCustomizer.h>

@class ABI30_0_0RCTJSStackFrame;

@interface ABI30_0_0RCTRedBox : NSObject <ABI30_0_0RCTBridgeModule>

- (void)registerErrorCustomizer:(id<ABI30_0_0RCTErrorCustomizer>)errorCustomizer;
- (void)showError:(NSError *)error;
- (void)showErrorMessage:(NSString *)message;
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details;
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack;
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<ABI30_0_0RCTJSStackFrame *> *)stack;
- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<ABI30_0_0RCTJSStackFrame *> *)stack;

- (void)dismiss;

/** Overrides bridge.bundleURL. Modify on main thread only. You shouldn't need to use this. */
@property (nonatomic, strong) NSURL *overrideBundleURL;

/** Overrides the default behavior of calling [bridge reload] on reload. You shouldn't need to use this. */
@property (nonatomic, strong) dispatch_block_t overrideReloadAction;

@end

/**
 * This category makes the red box instance available via the ABI30_0_0RCTBridge, which
 * is useful for any class that needs to access the red box or error log.
 */
@interface ABI30_0_0RCTBridge (ABI30_0_0RCTRedBox)

@property (nonatomic, readonly) ABI30_0_0RCTRedBox *redBox;

@end
