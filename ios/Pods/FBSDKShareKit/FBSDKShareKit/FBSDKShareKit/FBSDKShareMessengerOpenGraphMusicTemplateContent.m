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

#import "FBSDKShareMessengerOpenGraphMusicTemplateContent.h"

static NSString *const kMusicTemplatePageIDKey = @"pageID";
static NSString *const kMusicTemplateURLKey = @"url";
static NSString *const kMusicTemplateButtonKey = @"button";
static NSString *const kMusicTemplateUUIDKey = @"uuid";

@implementation FBSDKShareMessengerOpenGraphMusicTemplateContent

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
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:kMusicTemplatePageIDKey];
    _url = [decoder decodeObjectOfClass:[NSURL class] forKey:kMusicTemplateURLKey];
    _button = [decoder decodeObjectForKey:kMusicTemplateButtonKey];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:kMusicTemplateUUIDKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_pageID forKey:kMusicTemplatePageIDKey];
  [encoder encodeObject:_url forKey:kMusicTemplateURLKey];
  [encoder encodeObject:_button forKey:kMusicTemplateButtonKey];
  [encoder encodeObject:_shareUUID forKey:kMusicTemplateUUIDKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareMessengerOpenGraphMusicTemplateContent *copy = [[FBSDKShareMessengerOpenGraphMusicTemplateContent alloc] init];
  copy->_pageID = [_pageID copy];
  copy->_url = [_url copy];
  copy->_button = [_button copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
