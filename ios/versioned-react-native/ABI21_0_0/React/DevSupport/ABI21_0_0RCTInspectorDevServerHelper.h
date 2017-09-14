// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSBase.h>
#import <ReactABI21_0_0/ABI21_0_0RCTDefines.h>

#if ABI21_0_0RCT_DEV

@interface ABI21_0_0RCTInspectorDevServerHelper : NSObject

+ (void)connectForContext:(JSGlobalContextRef)context
            withBundleURL:(NSURL *)bundleURL;
@end

#endif
