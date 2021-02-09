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

#import "FBSDKCodelessPathComponent.h"

#import "FBSDKCodelessMacros.h"

@implementation FBSDKCodelessPathComponent

- (instancetype)initWithJSON:(NSDictionary *)dict {
  if (self = [super init]) {
    _className = [dict[CODELESS_MAPPING_CLASS_NAME_KEY] copy];
    _text = [dict[CODELESS_MAPPING_TEXT_KEY] copy];
    _hint = [dict[CODELESS_MAPPING_HINT_KEY] copy];
    _desc = [dict[CODELESS_MAPPING_DESC_KEY] copy];


    if (dict[CODELESS_MAPPING_INDEX_KEY]) {
      _index = [dict[CODELESS_MAPPING_INDEX_KEY] intValue];
    } else {
      _index = -1;
    }

    if (dict[CODELESS_MAPPING_SECTION_KEY]) {
      _section = [dict[CODELESS_MAPPING_SECTION_KEY] intValue];
    } else {
      _section = -1;
    }

    if (dict[CODELESS_MAPPING_ROW_KEY]) {
      _row = [dict[CODELESS_MAPPING_ROW_KEY] intValue];
    } else {
      _row = -1;
    }

    _tag = [dict[CODELESS_MAPPING_TAG_KEY] intValue];
    _matchBitmask = [dict[CODELESS_MAPPING_MATCH_BITMASK_KEY] intValue];
  }

  return self;
}

@end
