// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSBase.h>
#import <ReactABI23_0_0/ABI23_0_0RCTDefines.h>

#if ABI23_0_0RCT_DEV

@interface ABI23_0_0RCTInspectorDevServerHelper : NSObject

+ (void)connectForContext:(JSGlobalContextRef)context
            withBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
@end

#endif
