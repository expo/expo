/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "FlipperResponder.h"
#import "SKMacros.h"

SK_EXTERN_C_BEGIN
void FlipperPerformBlockOnMainThread(
    void (^block)(void),
    id<FlipperResponder> responder);
SK_EXTERN_C_END

@protocol FlipperConnection;

@protocol FlipperPlugin

/**
The plugin's identifier. This should map to a javascript plugin with the same
identifier to ensure messages are sent correctly.
*/
- (NSString*)identifier;

/**
Called when a connection has been established between this plugin and the
corresponding plugin on the Sonar desktop app. The provided connection can be
used to register method receivers as well as send messages back to the desktop
app.
*/
- (void)didConnect:(id<FlipperConnection>)connection;

/**
Called when a plugin has been disconnected and the SonarConnection provided in
didConnect is no longer valid to use.
*/
- (void)didDisconnect;

/**
 Returns true if the plugin is meant to be run in background too, otherwise it
 returns false.
 */
@optional
- (BOOL)runInBackground;

@end
