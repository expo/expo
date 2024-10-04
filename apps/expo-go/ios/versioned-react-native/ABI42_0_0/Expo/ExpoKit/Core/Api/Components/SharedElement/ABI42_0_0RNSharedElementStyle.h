//
//  ABI42_0_0RNSharedElementStyle_h
//  ABI42_0_0React-native-shared-element
//

#ifndef ABI42_0_0RNSharedElementStyle_h
#define ABI42_0_0RNSharedElementStyle_h

#import <UIKit/UIKit.h>
#import "ABI42_0_0RNSharedElementCornerRadii.h"

@interface ABI42_0_0RNSharedElementStyle : NSObject
@property (nonatomic, weak) UIView *view;
@property (nonatomic, assign) CGRect layout;
@property (nonatomic, assign) CGSize size;
@property (nonatomic, assign) CATransform3D transform;
@property (nonatomic, assign) UIViewContentMode contentMode;
@property (nonatomic, assign) CGFloat opacity;
@property (nonatomic, strong) UIColor *backgroundColor;
@property (nonatomic, readonly) ABI42_0_0RNSharedElementCornerRadii *cornerRadii;
@property (nonatomic, assign) CGFloat borderWidth;
@property (nonatomic, strong) UIColor *borderColor;
@property (nonatomic, assign) CGFloat shadowOpacity;
@property (nonatomic, assign) CGFloat shadowRadius;
@property (nonatomic, assign) CGSize shadowOffset;
@property (nonatomic, strong) UIColor *shadowColor;
- (instancetype)init;
- (instancetype)initWithView:(UIView*) view;

+ (NSString*) stringFromTransform:(CATransform3D) transform;
+ (CATransform3D) getAbsoluteViewTransform:(UIView*) view;
+ (UIColor*) getInterpolatedColor:(UIColor*)color1 color2:(UIColor*)color2 position:(CGFloat)position;
+ (ABI42_0_0RNSharedElementStyle*) getInterpolatedStyle:(ABI42_0_0RNSharedElementStyle*)style1 style2:(ABI42_0_0RNSharedElementStyle*)style2 position:(CGFloat) position;

@end

#endif
