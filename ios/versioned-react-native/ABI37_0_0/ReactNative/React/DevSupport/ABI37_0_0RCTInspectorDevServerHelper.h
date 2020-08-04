// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>
#import <ABI37_0_0React/ABI37_0_0RCTInspectorPackagerConnection.h>

#if ABI37_0_0RCT_DEV && !TARGET_OS_UIKITFORMAC

@interface ABI37_0_0RCTInspectorDevServerHelper : NSObject

+ (ABI37_0_0RCTInspectorPackagerConnection *)connectWithBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
+ (void)attachDebugger:(NSString *)owner
         withBundleURL:(NSURL *)bundleURL
              withView:(UIViewController *)view;
@end

#endif
