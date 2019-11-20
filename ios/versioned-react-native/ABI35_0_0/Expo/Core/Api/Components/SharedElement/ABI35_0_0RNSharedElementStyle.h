//
//  ABI35_0_0RNSharedElementStyle_h
//  ReactABI35_0_0-native-shared-element
//

#ifndef ABI35_0_0RNSharedElementStyle_h
#define ABI35_0_0RNSharedElementStyle_h

#import <UIKit/UIKit.h>

@interface ABI35_0_0RNSharedElementStyle : NSObject
@property (nonatomic, assign) UIView* view;
@property (nonatomic, assign) CGRect layout;
@property (nonatomic, assign) CGSize size;
@property (nonatomic, assign) CATransform3D transform;
@property (nonatomic, assign) UIViewContentMode contentMode;
@property (nonatomic, assign) CGFloat opacity;
@property (nonatomic, assign) UIColor* backgroundColor;
@property (nonatomic, assign) CGFloat cornerRadius;
@property (nonatomic, assign) CGFloat borderWidth;
@property (nonatomic, assign) UIColor* borderColor;
@property (nonatomic, assign) CGFloat shadowOpacity;
@property (nonatomic, assign) CGFloat shadowRadius;
@property (nonatomic, assign) CGSize shadowOffset;
@property (nonatomic, assign) UIColor* shadowColor;
- (instancetype)init;

+ (NSString*) stringFromTransform:(CATransform3D) transform;
+ (CATransform3D) getAbsoluteViewTransform:(UIView*) view;
+ (UIColor*) getInterpolatedColor:(UIColor*)color1 color2:(UIColor*)color2 position:(CGFloat)position;
+ (ABI35_0_0RNSharedElementStyle*) getInterpolatedStyle:(ABI35_0_0RNSharedElementStyle*)style1 style2:(ABI35_0_0RNSharedElementStyle*)style2 position:(CGFloat) position;

@end

#endif
