/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTBridgeModule.h"
#import "ABI11_0_0RCTErrorCustomizer.h"

@interface ABI11_0_0RCTRedBox : NSObject <ABI11_0_0RCTBridgeModule>

- (void)registerErrorCustomizer:(id<ABI11_0_0RCTErrorCustomizer>)errorCustomizer;
- (void)showError:(NSError *)error;
- (void)showErrorMessage:(NSString *)message;
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details;
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack;
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;

- (void)dismiss;

@end

/**
 * This category makes the red box instance available via the ABI11_0_0RCTBridge, which
 * is useful for any class that needs to access the red box or error log.
 */
@interface ABI11_0_0RCTBridge (ABI11_0_0RCTRedBox)

@property (nonatomic, readonly) ABI11_0_0RCTRedBox *redBox;

@end
