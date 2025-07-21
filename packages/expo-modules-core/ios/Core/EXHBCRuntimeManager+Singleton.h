// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXAppContext;
@class EXHBCRuntimeDelegate;

// Only include RCTHost in new architecture builds
#if __has_include(<React/RCTHost.h>) && RCT_NEW_ARCH_ENABLED
#import <React/RCTHost.h>
#define EXPO_HBC_RCTHOST_AVAILABLE 1
#else
#define EXPO_HBC_RCTHOST_AVAILABLE 0
@protocol RCTHostRuntimeDelegate <NSObject>
@end
#endif

/**
 * Singleton manager for HBC runtime delegates that can be accessed from host initialization.
 */
@interface EXHBCRuntimeManagerSingleton : NSObject

/**
 * Shared instance of the HBC runtime manager.
 */
+ (instancetype)sharedInstance;

/**
 * Registers an app context for HBC injection.
 * This should be called when an ExpoBridgeModule is initialized.
 */
- (void)registerAppContext:(EXAppContext *)appContext;

/**
 * Gets the runtime delegate for the given app context.
 * This is used to set up the RCTHost runtime delegate.
 */
- (EXHBCRuntimeDelegate *)runtimeDelegateForAppContext:(EXAppContext *)appContext;

/**
 * Called when a runtime is initialized to perform HBC injection.
 * This is a static method that can be called from anywhere.
 */
+ (void)handleRuntimeInitialization:(void *)runtime forHost:(id)host;

/**
 * Creates and returns a runtime delegate that can be set on RCTHost.
 * This should be called during RCTHost setup.
 * Only available in new architecture builds.
 * 
 * Example usage:
 * ```
 * RCTHost *host = [[RCTHost alloc] init...];
 * host.runtimeDelegate = [EXHBCRuntimeManagerSingleton createRuntimeDelegateForHost:host];
 * ```
 */
+ (nullable id<RCTHostRuntimeDelegate>)createRuntimeDelegateForHost:(nullable id)host;

/**
 * Manually triggers HBC injection for all registered app contexts.
 * This should be used in legacy architecture when RCTHost is not available.
 */
+ (void)triggerHBCInjectionForLegacyArchitecture;

@end
