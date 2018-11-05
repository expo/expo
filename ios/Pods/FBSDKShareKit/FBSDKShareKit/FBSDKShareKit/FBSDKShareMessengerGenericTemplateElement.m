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

#import "FBSDKShareMessengerGenericTemplateElement.h"

static NSString *const kGenericTemplateTitleKey = @"title";
static NSString *const kGenericTemplateSubtitleKey = @"subtitle";
static NSString *const kGenericTemplateImageURLKey = @"imageURL";
static NSString *const kGenericTemplateDefaultActionKey = @"defaultAction";
static NSString *const kGenericTemplateButtonKey = @"button";

@implementation FBSDKShareMessengerGenericTemplateElement

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _title = [decoder decodeObjectOfClass:[NSString class] forKey:kGenericTemplateTitleKey];
    _subtitle = [decoder decodeObjectOfClass:[NSString class] forKey:kGenericTemplateSubtitleKey];
    _imageURL = [decoder decodeObjectOfClass:[NSURL class] forKey:kGenericTemplateImageURLKey];
    _defaultAction = [decoder decodeObjectForKey:kGenericTemplateDefaultActionKey];
    _button = [decoder decodeObjectForKey:kGenericTemplateButtonKey];

  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_title forKey:kGenericTemplateTitleKey];
  [encoder encodeObject:_subtitle forKey:kGenericTemplateSubtitleKey];
  [encoder encodeObject:_imageURL forKey:kGenericTemplateImageURLKey];
  [encoder encodeObject:_defaultAction forKey:kGenericTemplateDefaultActionKey];
  [encoder encodeObject:_button forKey:kGenericTemplateButtonKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareMessengerGenericTemplateElement *copy = [[FBSDKShareMessengerGenericTemplateElement alloc] init];
  copy->_title = [_title copy];
  copy->_subtitle = [_subtitle copy];
  copy->_imageURL = [_imageURL copy];
  copy->_defaultAction = [_defaultAction copy];
  copy->_button = [_button copy];
  return copy;
}

@end
