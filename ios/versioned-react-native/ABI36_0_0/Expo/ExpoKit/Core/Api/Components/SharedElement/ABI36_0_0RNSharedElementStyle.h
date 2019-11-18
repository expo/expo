//
//  ABI36_0_0RNSharedElementStyle_h
//  ABI36_0_0React-native-shared-element
//

#ifndef ABI36_0_0RNSharedElementStyle_h
#define ABI36_0_0RNSharedElementStyle_h

#import <UIKit/UIKit.h>

@interface ABI36_0_0RNSharedElementStyle : NSObject
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
+ (ABI36_0_0RNSharedElementStyle*) getInterpolatedStyle:(ABI36_0_0RNSharedElementStyle*)style1 style2:(ABI36_0_0RNSharedElementStyle*)style2 position:(CGFloat) position;

@end

#endif
