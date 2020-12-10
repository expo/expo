/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Flipper/FlipperConnection.h>
#import <FlipperKit/FlipperConnection.h>

/**
FlipperCppBridgingConnection is a simple ObjC wrapper around SonarConnection
that forwards messages to the underlying C++ connection. This class allows
pure Objective-C plugins to send messages to the underlying connection.
*/
@interface FlipperCppBridgingConnection : NSObject<FlipperConnection>
- (instancetype)initWithCppConnection:
    (std::shared_ptr<facebook::flipper::FlipperConnection>)conn;
@end
