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

typedef NS_OPTIONS(int, FBSDKCodelessMatchBitmaskField)
{
  FBSDKCodelessMatchBitmaskFieldID = 1,
  FBSDKCodelessMatchBitmaskFieldText = 1 << 1,
  FBSDKCodelessMatchBitmaskFieldTag = 1 << 2,
  FBSDKCodelessMatchBitmaskFieldDescription = 1 << 3,
  FBSDKCodelessMatchBitmaskFieldHint = 1 << 4
};

NS_SWIFT_NAME(CodelessPathComponent)
@interface FBSDKCodelessPathComponent : NSObject

@property (nonatomic, copy, readonly) NSString *className;
@property (nonatomic, copy, readonly) NSString *text;
@property (nonatomic, copy, readonly) NSString *hint;
@property (nonatomic, copy, readonly) NSString *desc; // description
@property (nonatomic, readonly) int index;
@property (nonatomic, readonly) int tag;
@property (nonatomic, readonly) int section;
@property (nonatomic, readonly) int row;
@property (nonatomic, readonly) int matchBitmask;

- (instancetype)initWithJSON:(NSDictionary*)dict;

@end
