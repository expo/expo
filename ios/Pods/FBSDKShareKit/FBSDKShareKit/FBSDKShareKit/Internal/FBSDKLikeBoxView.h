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

#import <UIKit/UIKit.h>

/**
 NS_ENUM(NSUInteger, FBSDKLikeBoxCaretPosition)

  Specifies the position of the caret relative to the box.
 */
typedef NS_ENUM(NSUInteger, FBSDKLikeBoxCaretPosition)
{
  /** The caret is on the top of the box. */
  FBSDKLikeBoxCaretPositionTop,
  /** The caret is on the left of the box. */
  FBSDKLikeBoxCaretPositionLeft,
  /** The caret is on the bottom of the box. */
  FBSDKLikeBoxCaretPositionBottom,
  /** The caret is on the right of the box. */
  FBSDKLikeBoxCaretPositionRight,
};

@interface FBSDKLikeBoxView : UIView

@property (nonatomic, assign) FBSDKLikeBoxCaretPosition caretPosition;
@property (nonatomic, copy) NSString *text;

@end
