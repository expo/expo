/*! @file OIDAuthStateChangeDelegate.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2015 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import <Foundation/Foundation.h>

@class OIDAuthState;

NS_ASSUME_NONNULL_BEGIN

/*! @protocol OIDAuthStateChangeDelegate
    @brief Delegate of the OIDAuthState used to monitor various changes in state.
 */
@protocol OIDAuthStateChangeDelegate <NSObject>

/*! @brief Called when the authorization state changes and any backing storage needs to be updated.
    @param state The @c OIDAuthState that changed.
    @discussion If you are storing the authorization state, you should update the storage when the
        state changes.
 */
- (void)didChangeState:(OIDAuthState *)state;

@end

NS_ASSUME_NONNULL_END
