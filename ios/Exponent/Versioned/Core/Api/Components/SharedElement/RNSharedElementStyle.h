//
//  RNSharedElementStyle_h
//  react-native-shared-element
//

#ifndef RNSharedElementStyle_h
#define RNSharedElementStyle_h

#import <UIKit/UIKit.h>

@interface RNSharedElementStyle : NSObject
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
+ (RNSharedElementStyle*) getInterpolatedStyle:(RNSharedElementStyle*)style1 style2:(RNSharedElementStyle*)style2 position:(CGFloat) position;

@end

#endif
