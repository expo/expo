// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSBase.h>
#import <ReactABI24_0_0/ABI24_0_0RCTDefines.h>

#if ABI24_0_0RCT_DEV

@interface ABI24_0_0RCTInspectorDevServerHelper : NSObject

+ (void)connectForContext:(JSGlobalContextRef)context
            withBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
@end

#endif
