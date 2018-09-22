/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/*!
 Represents the registration of a cancellation observer with a cancellation token.
 Can be used to unregister the observer at a later time.
 */
@interface BFCancellationTokenRegistration : NSObject

/*!
 Removes the cancellation observer registered with the token
 and releases all resources associated with this registration.
 */
- (void)dispose;

@end

NS_ASSUME_NONNULL_END
