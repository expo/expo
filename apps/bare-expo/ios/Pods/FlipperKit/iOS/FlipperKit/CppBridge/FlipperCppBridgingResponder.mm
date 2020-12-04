/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FlipperCppBridgingResponder.h"

#import <FBCxxFollyDynamicConvert/FBCxxFollyDynamicConvert.h>

@implementation FlipperCppBridgingResponder {
  std::shared_ptr<facebook::flipper::FlipperResponder> responder_;
}

- (instancetype)initWithCppResponder:
    (std::shared_ptr<facebook::flipper::FlipperResponder>)responder {
  if (!responder) {
    return nil;
  }

  if (self = [super init]) {
    responder_ = responder;
  }

  return self;
}

#pragma mark - FlipperResponder

- (void)success:(NSDictionary*)response {
  responder_->success(
      facebook::cxxutils::convertIdToFollyDynamic(response, true));
}

- (void)error:(NSDictionary*)response {
  responder_->error(
      facebook::cxxutils::convertIdToFollyDynamic(response, true));
}

@end
