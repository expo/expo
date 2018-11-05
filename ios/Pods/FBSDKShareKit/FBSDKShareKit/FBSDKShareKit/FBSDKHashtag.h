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

/**
  Represents a single hashtag that can be used with the share dialog.
 */
@interface FBSDKHashtag : NSObject <FBSDKCopying, NSSecureCoding>

/**
  Convenience method to build a new hashtag with a string identifier. Equivalent to setting the
   `stringRepresentation` property.
 @param hashtagString The hashtag string.
 */
+ (instancetype)hashtagWithString:(NSString *)hashtagString;

/**
  The hashtag string.

 You are responsible for making sure that `stringRepresentation` is a valid hashtag (a single '#' followed
   by one or more word characters). Invalid hashtags are ignored when sharing content. You can check validity with the
   `valid` property.
 @return The hashtag string.
 */
@property (nonatomic, readwrite, copy) NSString *stringRepresentation;

/**
  Tests if a hashtag is valid.

 A valid hashtag matches the regular expression "#\w+": A single '#' followed by one or more
   word characters.
 @return YES if the hashtag is valid, NO otherwise.
 */
@property (nonatomic, readonly, assign, getter=isValid) BOOL valid;

/**
  Compares the receiver to another hashtag.
 @param hashtag The other hashtag
 @return YES if the receiver is equal to the other hashtag; otherwise NO
 */
- (BOOL)isEqualToHashtag:(FBSDKHashtag *)hashtag;

@end
