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

#import <FBSDKShareKit/FBSDKLikeObjectType.h>
#import <FBSDKShareKit/FBSDKLiking.h>

/**
 NS_ENUM (NSUInteger, FBSDKLikeControlAuxiliaryPosition)

  Specifies the position of the auxiliary view relative to the like button.
 */
typedef NS_ENUM(NSUInteger, FBSDKLikeControlAuxiliaryPosition)
{
  /** The auxiliary view is inline with the like button. */
  FBSDKLikeControlAuxiliaryPositionInline,
  /** The auxiliary view is above the like button. */
  FBSDKLikeControlAuxiliaryPositionTop,
  /** The auxiliary view is below the like button. */
  FBSDKLikeControlAuxiliaryPositionBottom,
};

/**
  Converts an FBSDKLikeControlAuxiliaryPosition to an NSString.
 */
FOUNDATION_EXPORT NSString *NSStringFromFBSDKLikeControlAuxiliaryPosition(FBSDKLikeControlAuxiliaryPosition auxiliaryPosition);

/**
 NS_ENUM(NSUInteger, FBSDKLikeControlHorizontalAlignment)

  Specifies the horizontal alignment for FBSDKLikeControlStyleStandard with
 FBSDKLikeControlAuxiliaryPositionTop or FBSDKLikeControlAuxiliaryPositionBottom.
 */
typedef NS_ENUM(NSUInteger, FBSDKLikeControlHorizontalAlignment)
{
  /** The subviews are left aligned. */
  FBSDKLikeControlHorizontalAlignmentLeft,
  /** The subviews are center aligned. */
  FBSDKLikeControlHorizontalAlignmentCenter,
  /** The subviews are right aligned. */
  FBSDKLikeControlHorizontalAlignmentRight,
};

/**
  Converts an FBSDKLikeControlHorizontalAlignment to an NSString.
 */
FOUNDATION_EXPORT NSString *NSStringFromFBSDKLikeControlHorizontalAlignment(FBSDKLikeControlHorizontalAlignment horizontalAlignment);

/**
 NS_ENUM (NSUInteger, FBSDKLikeControlStyle)

  Specifies the style of a like control.
 */
typedef NS_ENUM(NSUInteger, FBSDKLikeControlStyle)
{
  /** Displays the button and the social sentence. */
  FBSDKLikeControlStyleStandard = 0,
  /** Displays the button and a box that contains the like count. */
  FBSDKLikeControlStyleBoxCount,
};

/**
  Converts an FBSDKLikeControlStyle to an NSString.
 */
FOUNDATION_EXPORT NSString *NSStringFromFBSDKLikeControlStyle(FBSDKLikeControlStyle style);

/**
  Warning: This class is deprecated.
  UI control to like an object in the Facebook graph.


 Taps on the like button within this control will invoke an API call to the Facebook app through a
 fast-app-switch that allows the user to like the object.  Upon return to the calling app, the view will update
 with the new state and send actions for the UIControlEventValueChanged event.
 */
DEPRECATED_MSG_ATTRIBUTE("This is no longer available")
@interface FBSDKLikeControl : UIControl <FBSDKLiking>

/**
  The foreground color to use for the content of the receiver.
 */
@property (nonatomic, strong) UIColor *foregroundColor;

/**
  The position for the auxiliary view for the receiver.


 @see FBSDKLikeControlAuxiliaryPosition
 */
@property (nonatomic, assign) FBSDKLikeControlAuxiliaryPosition likeControlAuxiliaryPosition;

/**
  The text alignment of the social sentence.


 This value is only valid for FBSDKLikeControlStyleStandard with
 FBSDKLikeControlAuxiliaryPositionTop|Bottom.
 */
@property (nonatomic, assign) FBSDKLikeControlHorizontalAlignment likeControlHorizontalAlignment;

/**
  The style to use for the receiver.


 @see FBSDKLikeControlStyle
 */
@property (nonatomic, assign) FBSDKLikeControlStyle likeControlStyle;

/**
  The preferred maximum width (in points) for autolayout.


 This property affects the size of the receiver when layout constraints are applied to it. During layout,
 if the text extends beyond the width specified by this property, the additional text is flowed to one or more new
 lines, thereby increasing the height of the receiver.
 */
@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;

/**
  If YES, a sound is played when the receiver is toggled.

 @default YES
 */
@property (nonatomic, assign, getter = isSoundEnabled) BOOL soundEnabled;

@end
