/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "FlipperKitReactPlugin.h"

#import <FlipperKit/FlipperClient.h>
#import <FlipperKit/FlipperConnection.h>
#import <FlipperKit/FlipperResponder.h>

// This class is no longer needed, but kept here for backward compatibility
@implementation FlipperKitReactPlugin

- (NSString*)identifier {
  return @"React";
}

- (void)didConnect:(id<FlipperConnection>)connection {
}

- (void)didDisconnect {
}

@end

#endif
