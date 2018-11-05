// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/*!
 @abstract Describes the initial response when starting the device login flow.
 @discussion This is used by `FBSDKDeviceLoginManager`.
 */
@interface FBSDKDeviceLoginCodeInfo : NSObject

/*!
 @abstract There is no public initializer.
 */
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/*!
 @abstract the unique id for this login flow.
*/
@property (nonatomic, copy, readonly) NSString *identifier;

/*!
 @abstract the short "user_code" that should be presented to the user.
*/
@property (nonatomic, copy, readonly) NSString *loginCode;

/*!
 @abstract the verification URL.
*/
@property (nonatomic, copy, readonly) NSURL *verificationURL;

/*!
 @abstract the expiration date.
*/
@property (nonatomic, copy, readonly) NSDate *expirationDate;

/*!
 @abstract the polling interval
*/
@property (nonatomic, assign, readonly) NSUInteger pollingInterval;

@end

NS_ASSUME_NONNULL_END
