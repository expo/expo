// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Only include RCTHost in new architecture builds
#if __has_include(<React/RCTHost.h>) && RCT_NEW_ARCH_ENABLED
#import <React/RCTHost.h>

/**
 * App delegate wrapper that implements RCTHostDelegate to set up HBC injection.
 */
@interface EXAppDelegateWrapper : NSObject <RCTHostDelegate>
@end

#endif