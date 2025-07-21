// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXAppContext;

// Only include RCTHost in new architecture builds
#if __has_include(<React/RCTHost.h>) && RCT_NEW_ARCH_ENABLED
#import <React/RCTHost.h>
#define EXPO_HBC_RCTHOST_AVAILABLE 1
#else
#define EXPO_HBC_RCTHOST_AVAILABLE 0
// Forward declare the protocol for compatibility
@protocol RCTHostRuntimeDelegate <NSObject>
@end
#endif

/**
 * A runtime delegate that implements RCTHostRuntimeDelegate to handle 
 * Hermes Bytecode (HBC) injection before the main bundle loads.
 */
@interface EXHBCRuntimeDelegate : NSObject <RCTHostRuntimeDelegate>

/**
 * Initializes the HBC runtime delegate with the given app context.
 */
- (instancetype)initWithAppContext:(EXAppContext *)appContext;

/**
 * Manually trigger HBC injection for old architecture compatibility.
 */
- (void)injectHBCForLegacyArchitecture;

/**
 * Unified method to handle runtime initialization for both architectures.
 * This method takes void* parameters to avoid C++ type exposure.
 */
- (void)handleRuntimeInitialization:(void *)runtime forHost:(id)host;

@end