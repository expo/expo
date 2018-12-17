// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSBase.h>
#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTDefines.h>
#import <ReactABI32_0_0/ABI32_0_0RCTInspectorPackagerConnection.h>

#if ABI32_0_0RCT_DEV

@interface ABI32_0_0RCTInspectorDevServerHelper : NSObject

+ (ABI32_0_0RCTInspectorPackagerConnection *)connectWithBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
+ (void)attachDebugger:(NSString *)owner
         withBundleURL:(NSURL *)bundleURL
              withView:(UIViewController *)view;
@end

#endif
