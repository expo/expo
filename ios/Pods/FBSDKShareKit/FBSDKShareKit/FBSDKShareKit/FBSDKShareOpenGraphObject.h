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

#import <FBSDKCoreKit/FBSDKCopying.h>

#import <FBSDKShareKit/FBSDKShareOpenGraphValueContainer.h>

/**
  An Open Graph Object for sharing.

 The property keys MUST have namespaces specified on them, such as `og:image`,
  and `og:type` is required.

 See https://developers.facebook.com/docs/sharing/opengraph/object-properties for other properties.

 You can specify nested namespaces inline to define complex properties. For example, the following
 code will generate a fitness.course object with a location:

 FBSDKShareOpenGraphObject *course = [FBSDKShareOpenGraphObject objectWithProperties:
  @{
    @"og:type": @"fitness.course",
    @"og:title": @"Sample course",
    @"fitness:metrics:location:latitude": @"41.40338",
    @"fitness:metrics:location:longitude": @"2.17403",
 }];
 */
@interface FBSDKShareOpenGraphObject : FBSDKShareOpenGraphValueContainer <FBSDKCopying, NSSecureCoding>

/**
  Convenience method to build a new action and set the object for the specified key.
 @param properties Properties for the Open Graph object, which will be parsed into the proper models
 */
+ (instancetype)objectWithProperties:(NSDictionary *)properties;

/**
  Compares the receiver to another Open Graph Object.
 @param object The other object
 @return YES if the receiver's values are equal to the other object's values; otherwise NO
 */
- (BOOL)isEqualToShareOpenGraphObject:(FBSDKShareOpenGraphObject *)object;

@end
