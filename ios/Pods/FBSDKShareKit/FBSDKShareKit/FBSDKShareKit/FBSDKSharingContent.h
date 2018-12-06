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
#import <FBSDKShareKit/FBSDKSharingValidation.h>

@class FBSDKHashtag;

/**
  A base interface for content to be shared.
 */
@protocol FBSDKSharingContent <FBSDKCopying, FBSDKSharingValidation, NSSecureCoding>

/**
  URL for the content being shared.

 This URL will be checked for all link meta tags for linking in platform specific ways.  See documentation
 for App Links (https://developers.facebook.com/docs/applinks/)
 @return URL representation of the content link
 */
@property (nonatomic, copy) NSURL *contentURL;

/**
  Hashtag for the content being shared.
 @return The hashtag for the content being shared.
 */
@property (nonatomic, copy) FBSDKHashtag *hashtag;

/**
  List of IDs for taggable people to tag with this content.
  See documentation for Taggable Friends
 (https://developers.facebook.com/docs/graph-api/reference/user/taggable_friends)
 @return Array of IDs for people to tag (NSString)
 */
@property (nonatomic, copy) NSArray *peopleIDs;

/**
  The ID for a place to tag with this content.
 @return The ID for the place to tag
 */
@property (nonatomic, copy) NSString *placeID;

/**
  A value to be added to the referrer URL when a person follows a link from this shared content on feed.
 @return The ref for the content.
 */
@property (nonatomic, copy) NSString *ref;

/**
 For shares into Messenger, this pageID will be used to map the app to page and attach attribution to the share.
 @return The ID of the Facebok page this share is associated with.
 */
@property (nonatomic, copy) NSString *pageID;

/**
 A unique identifier for a share involving this content, useful for tracking purposes.
 @return A unique string identifying this share data.
 */
@property (nonatomic, copy, readonly) NSString *shareUUID;

/**
 Adds content to an existing dictionary as key/value pairs and returns the
 updated dictionary
 @param existingParameters An immutable dictionary of existing values
 @param bridgeOptions The options for bridging
 @return A new dictionary with the modified contents
 */
- (NSDictionary<NSString *, id> *)addParameters:(NSDictionary<NSString *, id> *)existingParameters
                                  bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions;

/**
 Adds content to a dictionary as key/value pairs.
 @param parameters A mutable dictionary that may be appended with key/value pairs of content.
 @param bridgeOptions The options for bridging
 */

- (void)addToParameters:(NSMutableDictionary<NSString *, id> *)parameters
          bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions
DEPRECATED_MSG_ATTRIBUTE("`addToParameters` is deprecated. Use `addParameters`");

@end
