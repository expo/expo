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

#import "FBSDKShareMessengerMediaTemplateContent.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKHashtag.h"
#import "FBSDKShareUtility.h"

static NSString *const kMediaTemplatePageIDKey = @"pageID";
static NSString *const kMediaTemplateMediaTypeKey = @"mediaType";
static NSString *const kMediaTemplateAttachmentIDKey = @"attachmentID";
static NSString *const kMediaTemplateMediaURLKey = @"mediaURL";
static NSString *const kMediaTemplateButtonKey = @"button";
static NSString *const kMediaTemplateUUIDKey = @"uuid";

@implementation FBSDKShareMessengerMediaTemplateContent

#pragma mark - Properties

@synthesize contentURL = _contentURL;
@synthesize hashtag = _hashtag;
@synthesize peopleIDs = _peopleIDs;
@synthesize placeID = _placeID;
@synthesize ref = _ref;
@synthesize pageID = _pageID;
@synthesize shareUUID = _shareUUID;

#pragma mark - Initializer

- (instancetype)initWithAttachmentID:(NSString *)attachmentID
{
  self = [super init];
  if (self) {
    _attachmentID = [attachmentID copy];
    _shareUUID = [NSUUID UUID].UUIDString;
  }
  return self;
}

- (instancetype)initWithMediaURL:(NSURL *)mediaURL
{
  self = [super init];
  if (self) {
    _mediaURL = [mediaURL copy];
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
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:kMediaTemplatePageIDKey];
    _mediaType = [[decoder decodeObjectForKey:kMediaTemplateMediaTypeKey] unsignedIntegerValue];
    _attachmentID = [decoder decodeObjectOfClass:[NSString class] forKey:kMediaTemplateAttachmentIDKey];
    _mediaURL = [decoder decodeObjectOfClass:[NSURL class] forKey:kMediaTemplateMediaURLKey];
    _button = [decoder decodeObjectForKey:kMediaTemplateButtonKey];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:kMediaTemplateUUIDKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_pageID forKey:kMediaTemplatePageIDKey];
  [encoder encodeObject:@(_mediaType) forKey:kMediaTemplateMediaTypeKey];
  [encoder encodeObject:_attachmentID forKey:kMediaTemplateAttachmentIDKey];
  [encoder encodeObject:_mediaURL forKey:kMediaTemplateMediaURLKey];
  [encoder encodeObject:_button forKey:kMediaTemplateButtonKey];
  [encoder encodeObject:_shareUUID forKey:kMediaTemplateUUIDKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareMessengerMediaTemplateContent *copy = [[FBSDKShareMessengerMediaTemplateContent alloc] init];
  copy->_pageID = [_pageID copy];
  copy->_mediaType = _mediaType;
  copy->_attachmentID = [_attachmentID copy];
  copy->_mediaURL = [_mediaURL copy];
  copy->_button = [_button copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
