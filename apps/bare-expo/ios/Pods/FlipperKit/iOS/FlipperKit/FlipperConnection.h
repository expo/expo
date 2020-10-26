/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol FlipperResponder;
@protocol FlipperConnectionManager;

typedef void (^SonarReceiver)(NSDictionary*, id<FlipperResponder>);

/**
Represents a connection between the Desktop and mobile plugins with
corresponding identifiers.
*/
@protocol FlipperConnection

/**
Invoke a method on the Sonar desktop plugin with with a matching identifier.
*/
- (void)send:(NSString*)method withParams:(NSDictionary*)params;

/**
Register a receiver to be notified of incoming calls of the given method from
the Sonar desktop plugin with a matching identifier.
*/
- (void)receive:(NSString*)method withBlock:(SonarReceiver)receiver;

/**
Report an error to the Flipper desktop app
*/
- (void)errorWithMessage:(NSString*)message stackTrace:(NSString*)stacktrace;

@end
