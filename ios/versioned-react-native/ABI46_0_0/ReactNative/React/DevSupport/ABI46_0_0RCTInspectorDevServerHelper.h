/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>
#import <ABI46_0_0React/ABI46_0_0RCTInspectorPackagerConnection.h>

#if ABI46_0_0RCT_DEV

@interface ABI46_0_0RCTInspectorDevServerHelper : NSObject

+ (ABI46_0_0RCTInspectorPackagerConnection *)connectWithBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
+ (void)openURL:(NSString *)url withBundleURL:(NSURL *)bundleURL withErrorMessage:(NSString *)errorMessage;
@end

#endif
