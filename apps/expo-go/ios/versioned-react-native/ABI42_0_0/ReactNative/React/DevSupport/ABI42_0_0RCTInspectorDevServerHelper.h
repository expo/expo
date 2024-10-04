/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>
#import <ABI42_0_0React/ABI42_0_0RCTInspectorPackagerConnection.h>

#if ABI42_0_0RCT_DEV

@interface ABI42_0_0RCTInspectorDevServerHelper : NSObject

+ (ABI42_0_0RCTInspectorPackagerConnection *)connectWithBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
@end

#endif
