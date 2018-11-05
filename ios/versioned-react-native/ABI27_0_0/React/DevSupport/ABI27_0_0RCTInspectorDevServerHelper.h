// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSBase.h>
#import <UIKit/UIKit.h>

#import <ReactABI27_0_0/ABI27_0_0RCTDefines.h>
#import <ReactABI27_0_0/ABI27_0_0RCTInspectorPackagerConnection.h>

#if ABI27_0_0RCT_DEV

@interface ABI27_0_0RCTInspectorDevServerHelper : NSObject

+ (ABI27_0_0RCTInspectorPackagerConnection *)connectWithBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
+ (void)attachDebugger:(NSString *)owner
         withBundleURL:(NSURL *)bundleURL
              withView:(UIViewController *)view;
@end

#endif
