/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef FB_SONARKIT_ENABLED

#import <Foundation/Foundation.h>
#import "FlipperKitCertificateProvider.h"
#import "FlipperPlugin.h"
#import "FlipperStateUpdateListener.h"

/**
Represents a connection between the Sonar desktop och client side. Manages the
lifecycle of attached plugin instances.
*/
@interface FlipperClient : NSObject

/**
The shared singleton FlipperClient instance. It is an error to call this on
non-debug builds to avoid leaking data.
*/
+ (instancetype)sharedClient;

/**
Register a plugin with the client.
*/
- (void)addPlugin:(NSObject<FlipperPlugin>*)plugin;

/**
Unregister a plugin with the client.
*/
- (void)removePlugin:(NSObject<FlipperPlugin>*)plugin;

/**
Retrieve the plugin with a given identifier which was previously registered with
this client.
*/
- (NSObject<FlipperPlugin>*)pluginWithIdentifier:(NSString*)identifier;

/**
Establish a connection to the Sonar desktop.
*/
- (void)start;

/**
Stop the connection to the Sonar desktop.
*/
- (void)stop;

/**
Get the log of state changes from the sonar client
*/
- (NSString*)getState;

/**
 Get the current summarized state of the sonar client
 */
- (NSArray<NSDictionary*>*)getStateElements;

/**
Subscribe a ViewController to state update change notifications
*/
- (void)subscribeForUpdates:(id<FlipperStateUpdateListener>)controller;

/**
Sets the certificate provider responsible for obtaining certificates
*/
- (void)setCertificateProvider:(id<FlipperKitCertificateProvider>)provider;

/**
 Get the certificate provider of Flipper Client
*/
- (id<FlipperKitCertificateProvider>)getCertificateProvider;

// initializers are disabled. You must use `+[FlipperClient sharedClient]`
// instance.
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

@end

#endif
