/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTDefines.h>
#import <ABI44_0_0React/ABI44_0_0RCTInspectorPackagerConnection.h>

#if ABI44_0_0RCT_DEV

@interface ABI44_0_0RCTInspectorDevServerHelper : NSObject

+ (ABI44_0_0RCTInspectorPackagerConnection *)connectWithBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
+ (void)openURL:(NSString *)url withBundleURL:(NSURL *)bundleURL withErrorMessage:(NSString *)errorMessage;
@end

#endif
