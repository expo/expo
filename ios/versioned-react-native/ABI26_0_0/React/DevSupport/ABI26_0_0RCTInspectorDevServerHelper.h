// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSBase.h>
#import <UIKit/UIKit.h>

#import <ReactABI26_0_0/ABI26_0_0RCTDefines.h>

#if ABI26_0_0RCT_DEV

@interface ABI26_0_0RCTInspectorDevServerHelper : NSObject

+ (void)connectWithBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
+ (void)attachDebugger:(NSString *)owner
         withBundleURL:(NSURL *)bundleURL
              withView:(UIViewController *)view;
@end

#endif
