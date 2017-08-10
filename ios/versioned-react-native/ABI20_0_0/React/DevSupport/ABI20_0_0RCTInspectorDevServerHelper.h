// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSBase.h>
#import <ReactABI20_0_0/ABI20_0_0RCTDefines.h>

#if ABI20_0_0RCT_DEV

@interface ABI20_0_0RCTInspectorDevServerHelper : NSObject

+ (void)connectForContext:(JSGlobalContextRef)context
            withBundleURL:(NSURL *)bundleURL;
@end

#endif
