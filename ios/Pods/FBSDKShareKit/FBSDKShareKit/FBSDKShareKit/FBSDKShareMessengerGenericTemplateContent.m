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

#import "FBSDKShareMessengerGenericTemplateContent.h"

#import "FBSDKShareMessengerGenericTemplateElement.h"

static NSString *const kGenericTemplatePageIDKey = @"pageID";
static NSString *const kGenericTemplateUUIDKey = @"UUID";
static NSString *const kGenericTemplateIsSharableKey = @"isSharable";
static NSString *const kGenericTemplateImageAspectRatioKey = @"imageAspectRatio";
static NSString *const kGenericTemplateElementKey = @"element";

@implementation FBSDKShareMessengerGenericTemplateContent

#pragma mark - Properties

@synthesize contentURL = _contentURL;
@synthesize hashtag = _hashtag;
@synthesize peopleIDs = _peopleIDs;
@synthesize placeID = _placeID;
@synthesize ref = _ref;
@synthesize pageID = _pageID;
@synthesize shareUUID = _shareUUID;

#pragma mark - Initializer

- (instancetype)init
{
  self = [super init];
  if (self) {
    _shareUUID = [NSUUID UUID].UUIDString;
  }
  return self;
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:kGenericTemplatePageIDKey];
    _isSharable = [decoder decodeBoolForKey:kGenericTemplateIsSharableKey];
    _imageAspectRatio = [[decoder decodeObjectOfClass:[NSNumber class] forKey:kGenericTemplateImageAspectRatioKey] unsignedIntegerValue];
    _element = [decoder decodeObjectForKey:kGenericTemplateElementKey];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:kGenericTemplateUUIDKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_pageID forKey:kGenericTemplatePageIDKey];
  [encoder encodeBool:_isSharable forKey:kGenericTemplateIsSharableKey];
  [encoder encodeObject:@(_imageAspectRatio) forKey:kGenericTemplateImageAspectRatioKey];
  [encoder encodeObject:_element forKey:kGenericTemplateElementKey];
  [encoder encodeObject:_shareUUID forKey:kGenericTemplateUUIDKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareMessengerGenericTemplateContent *copy = [[FBSDKShareMessengerGenericTemplateContent alloc] init];
  copy->_pageID = [_pageID copy];
  copy->_isSharable = _isSharable;
  copy->_imageAspectRatio = _imageAspectRatio;
  copy->_element = [_element copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
