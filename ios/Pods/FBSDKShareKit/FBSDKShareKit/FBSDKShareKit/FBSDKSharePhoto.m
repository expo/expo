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

#import "FBSDKSharePhoto.h"

#import "FBSDKCoreKit+Internal.h"

#define FBSDK_SHARE_PHOTO_IMAGE_KEY @"image"
#define FBSDK_SHARE_PHOTO_IMAGE_URL_KEY @"imageURL"
#define FBSDK_SHARE_PHOTO_USER_GENERATED_KEY @"userGenerated"
#define FBSDK_SHARE_PHOTO_CAPTION_KEY @"caption"

@implementation FBSDKSharePhoto

#pragma mark - Class Methods

+ (instancetype)photoWithImage:(UIImage *)image userGenerated:(BOOL)userGenerated
{
  FBSDKSharePhoto *photo = [[self alloc] init];
  photo.image = image;
  photo.userGenerated = userGenerated;
  return photo;
}

+ (instancetype)photoWithImageURL:(NSURL *)imageURL userGenerated:(BOOL)userGenerated
{
  FBSDKSharePhoto *photo = [[self alloc] init];
  photo.imageURL = imageURL;
  photo.userGenerated = userGenerated;
  return photo;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [_image hash],
    [_imageURL hash],
    [_caption hash],
    (_userGenerated ? 1u : 0u)
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKSharePhoto class]]) {
    return NO;
  }
  return [self isEqualToSharePhoto:(FBSDKSharePhoto *)object];
}

- (BOOL)isEqualToSharePhoto:(FBSDKSharePhoto *)photo
{
  return (photo &&
          (_userGenerated == photo.userGenerated) &&
          [FBSDKInternalUtility object:_image isEqualToObject:photo.image] &&
          [FBSDKInternalUtility object:_imageURL isEqualToObject:photo.imageURL] &&
          [FBSDKInternalUtility object:_caption isEqualToObject:photo.caption]);
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _image = [decoder decodeObjectOfClass:[UIImage class] forKey:FBSDK_SHARE_PHOTO_IMAGE_KEY];
    _imageURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_SHARE_PHOTO_IMAGE_URL_KEY];
    _userGenerated = [decoder decodeBoolForKey:FBSDK_SHARE_PHOTO_USER_GENERATED_KEY];
    _caption = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_PHOTO_CAPTION_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_image forKey:FBSDK_SHARE_PHOTO_IMAGE_KEY];
  [encoder encodeObject:_imageURL forKey:FBSDK_SHARE_PHOTO_IMAGE_URL_KEY];
  [encoder encodeBool:_userGenerated forKey:FBSDK_SHARE_PHOTO_USER_GENERATED_KEY];
  [encoder encodeObject:_caption forKey:FBSDK_SHARE_PHOTO_CAPTION_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKSharePhoto *copy = [[FBSDKSharePhoto alloc] init];
  copy->_image = [_image copy];
  copy->_imageURL = [_imageURL copy];
  copy->_userGenerated = _userGenerated;
  copy->_caption = [_caption copy];
  return copy;
}

@end
