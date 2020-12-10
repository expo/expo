// Copyright 2004-present Facebook. All Rights Reserved.
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

NS_ASSUME_NONNULL_BEGIN

/**
 Describes the look and feel of a native ad view.
 */
@interface FBNativeAdViewAttributes : NSObject <NSCopying>

/**
 This is a method to create native ad view attributes with a dictionary
 */
- (instancetype)initWithDictionary:(NSDictionary<id, id> *)dict NS_DESIGNATED_INITIALIZER;

/**
 Background color of the native ad view.
 */
@property (nonatomic, copy, nullable) UIColor *backgroundColor;
/**
 Color of the title label.
 */
@property (nonatomic, copy, nullable) UIColor *titleColor;
/**
 Color of the advertiser name label.
 */
@property (nonatomic, copy, nullable) UIColor *advertiserNameColor;
/**
 Color of the ad choices icon.
 */
@property (nonatomic, copy, nullable) UIColor *adChoicesForegroundColor;
/**
 Font of the title label.
 */
@property (nonatomic, copy, nullable) UIFont *titleFont;
/**
 Color of the description label.
 */
@property (nonatomic, copy, nullable) UIColor *descriptionColor;
/**
 Font of the description label.
 */
@property (nonatomic, copy, nullable) UIFont *descriptionFont;
/**
 Background color of the call to action button.
 */
@property (nonatomic, copy, nullable) UIColor *buttonColor;
/**
 Color of the call to action button's title label.
 */
@property (nonatomic, copy, nullable) UIColor *buttonTitleColor;
/**
 Font of the call to action button's title label.
 */
@property (nonatomic, copy, nullable) UIFont *buttonTitleFont;
/**
 Border color of the call to action button. If nil, no border is shown.
 */
@property (nonatomic, copy, nullable) UIColor *buttonBorderColor;
/**
 Enables or disables autoplay for some types of media. Defaults to YES.
 */
@property (nonatomic, assign, getter=isAutoplayEnabled) BOOL autoplayEnabled
    __attribute((deprecated("This attribute is no longer used.")));

@end

NS_ASSUME_NONNULL_END
