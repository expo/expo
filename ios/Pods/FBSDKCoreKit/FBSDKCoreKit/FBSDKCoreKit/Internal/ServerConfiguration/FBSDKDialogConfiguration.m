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

#import "FBSDKDialogConfiguration.h"

#import "FBSDKMacros.h"

#define FBSDK_DIALOG_CONFIGURATION_APP_VERSIONS_KEY @"appVersions"
#define FBSDK_DIALOG_CONFIGURATION_NAME_KEY @"name"
#define FBSDK_DIALOG_CONFIGURATION_URL_KEY @"url"

@implementation FBSDKDialogConfiguration

#pragma mark - Object Lifecycle

- (instancetype)initWithName:(NSString *)name URL:(NSURL *)URL appVersions:(NSArray *)appVersions
{
  if ((self = [super init])) {
    _name = [name copy];
    _URL = [URL copy];
    _appVersions = [appVersions copy];
  }
  return self;
}

- (instancetype)init
{
  FBSDK_NOT_DESIGNATED_INITIALIZER(initWithName:URL:appVersions:);
  return [self initWithName:nil URL:nil appVersions:nil];
}

#pragma mark NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  NSString *name = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_DIALOG_CONFIGURATION_NAME_KEY];
  NSURL *URL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_DIALOG_CONFIGURATION_URL_KEY];
  NSSet *appVersionsClasses = [NSSet setWithObjects:[NSArray class], [NSNumber class], nil];
  NSArray *appVersions = [decoder decodeObjectOfClasses:appVersionsClasses
                                                 forKey:FBSDK_DIALOG_CONFIGURATION_APP_VERSIONS_KEY];
  return [self initWithName:name URL:URL appVersions:appVersions];
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_appVersions forKey:FBSDK_DIALOG_CONFIGURATION_APP_VERSIONS_KEY];
  [encoder encodeObject:_name forKey:FBSDK_DIALOG_CONFIGURATION_NAME_KEY];
  [encoder encodeObject:_URL forKey:FBSDK_DIALOG_CONFIGURATION_URL_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  return self;
}

@end
