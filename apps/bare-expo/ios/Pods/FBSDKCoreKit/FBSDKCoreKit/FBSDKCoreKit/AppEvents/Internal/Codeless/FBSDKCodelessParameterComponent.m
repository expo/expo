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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKCodelessParameterComponent.h"

 #import "FBSDKCodelessPathComponent.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKViewHierarchyMacros.h"

@implementation FBSDKCodelessParameterComponent

- (instancetype)initWithJSON:(NSDictionary *)dict
{
  if (self = [super init]) {
    _name = [dict[CODELESS_MAPPING_PARAMETER_NAME_KEY] copy];
    _value = [dict[CODELESS_MAPPING_PARAMETER_VALUE_KEY] copy];
    _pathType = [dict[CODELESS_MAPPING_PATH_TYPE_KEY] copy];

    NSArray *ary = dict[CODELESS_MAPPING_PATH_KEY];
    NSMutableArray *mut = [NSMutableArray array];
    for (NSDictionary *info in ary) {
      FBSDKCodelessPathComponent *component = [[FBSDKCodelessPathComponent alloc] initWithJSON:info];
      [FBSDKTypeUtility array:mut addObject:component];
    }
    _path = [mut copy];
  }

  return self;
}

- (BOOL)isEqualToParameter:(FBSDKCodelessParameterComponent *)parameter
{
  if (_path.count != parameter.path.count) {
    return NO;
  }

  NSString *current = [NSString stringWithFormat:@"%@|%@|%@",
                       _name ?: @"",
                       _value ?: @"",
                       _pathType ?: @""];
  NSString *compared = [NSString stringWithFormat:@"%@|%@|%@",
                        parameter.name ?: @"",
                        parameter.value ?: @"",
                        parameter.pathType ?: @""];

  if (![current isEqualToString:compared]) {
    return NO;
  }

  for (int i = 0; i < _path.count; i++) {
    if (![[FBSDKTypeUtility array:_path objectAtIndex:i] isEqualToPath:[FBSDKTypeUtility array:parameter.path objectAtIndex:i]]) {
      return NO;
    }
  }

  return YES;
}

@end

#endif
