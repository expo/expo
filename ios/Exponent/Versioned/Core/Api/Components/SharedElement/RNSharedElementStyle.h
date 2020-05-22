//
//  RNSharedElementStyle_h
//  react-native-shared-element
//

#ifndef RNSharedElementStyle_h
#define RNSharedElementStyle_h

#import <UIKit/UIKit.h>
#import "RNSharedElementCornerRadii.h"

@interface RNSharedElementStyle : NSObject
@property (nonatomic, weak) UIView *view;
@property (nonatomic, assign) CGRect layout;
@property (nonatomic, assign) CGSize size;
@property (nonatomic, assign) CATransform3D transform;
@property (nonatomic, assign) UIViewContentMode contentMode;
@property (nonatomic, assign) CGFloat opacity;
@property (nonatomic, strong) UIColor *backgroundColor;
@property (nonatomic, readonly) RNSharedElementCornerRadii *cornerRadii;
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
+ (RNSharedElementStyle*) getInterpolatedStyle:(RNSharedElementStyle*)style1 style2:(RNSharedElementStyle*)style2 position:(CGFloat) position;

@end

#endif
