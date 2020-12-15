/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Flipper/FlipperResponder.h>
#import <FlipperKit/FlipperResponder.h>

/**
SonarCppBridgingResponder is a simple ObjC wrapper around FlipperResponder
that forwards messages to the underlying C++ responder. This class allows
pure Objective-C plugins to send messages to the underlying responder.
*/
@interface FlipperCppBridgingResponder : NSObject<FlipperResponder>
- (instancetype)initWithCppResponder:
    (std::shared_ptr<facebook::flipper::FlipperResponder>)responder;
@end
