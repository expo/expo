/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>


extern NSString *const ABI26_0_0RCTTVRemoteEventMenu;
extern NSString *const ABI26_0_0RCTTVRemoteEventPlayPause;
extern NSString *const ABI26_0_0RCTTVRemoteEventSelect;

extern NSString *const ABI26_0_0RCTTVRemoteEventLongPlayPause;
extern NSString *const ABI26_0_0RCTTVRemoteEventLongSelect;

extern NSString *const ABI26_0_0RCTTVRemoteEventLeft;
extern NSString *const ABI26_0_0RCTTVRemoteEventRight;
extern NSString *const ABI26_0_0RCTTVRemoteEventUp;
extern NSString *const ABI26_0_0RCTTVRemoteEventDown;

extern NSString *const ABI26_0_0RCTTVRemoteEventSwipeLeft;
extern NSString *const ABI26_0_0RCTTVRemoteEventSwipeRight;
extern NSString *const ABI26_0_0RCTTVRemoteEventSwipeUp;
extern NSString *const ABI26_0_0RCTTVRemoteEventSwipeDown;

@interface ABI26_0_0RCTTVRemoteHandler : NSObject

@property (nonatomic, copy, readonly) NSDictionary *tvRemoteGestureRecognizers;

@end
