/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

/**
Acts as a hook for providing return values to remote called from Sonar desktop
plugins.
*/
@protocol FlipperResponder

/**
Respond with a successful return value.
*/
- (void)success:(NSDictionary*)response;

/**
Respond with an error.
*/
- (void)error:(NSDictionary*)response;

@end
