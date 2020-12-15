/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "FlipperPlugin.h"
#import "FlipperResponder.h"

void FlipperPerformBlockOnMainThread(
    void (^block)(void),
    id<FlipperResponder> responder) {
  if ([NSThread isMainThread]) {
    @try {
      block();
    } @catch (NSException* e) {
      [responder error:@{@"name" : e.name, @"message" : e.reason}];
    } @catch (...) {
      [responder error:@{
        @"name" : @"Unknown",
        @"message" :
            @"Unknown error caught when processing operation on main thread"
      }];
    }
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      @try {
        block();
      } @catch (NSException* e) {
        [responder error:@{@"name" : e.name, @"message" : e.reason}];
      } @catch (...) {
        [responder error:@{
          @"name" : @"Unknown",
          @"message" :
              @"Unknown error caught when processing operation on main thread"
        }];
      }
    });
  }
}
