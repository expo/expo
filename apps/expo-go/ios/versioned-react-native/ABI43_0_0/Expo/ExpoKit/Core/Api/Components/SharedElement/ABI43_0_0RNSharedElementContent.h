//
//  ABI43_0_0RNSharedElementContent_h
//  ABI43_0_0React-native-shared-element
//

#ifndef ABI43_0_0RNSharedElementContent_h
#define ABI43_0_0RNSharedElementContent_h

#import <UIKit/UIKit.h>
#import "ABI43_0_0RNSharedElementTypes.h"

@interface ABI43_0_0RNSharedElementContent : NSObject
@property (nonatomic, readonly) id data;
@property (nonatomic, readonly) ABI43_0_0RNSharedElementContentType type;
@property (nonatomic, readonly) UIEdgeInsets insets;

- (instancetype)initWithData:(id) data type:(ABI43_0_0RNSharedElementContentType)type insets:(UIEdgeInsets)insets;
- (NSString*) typeName;

+ (BOOL) isKindOfImageView:(UIView*) view;
+ (UIImageView*) imageViewFromView:(UIView*) view;

+ (CGRect) layoutForRect:(CGRect)layout content:(ABI43_0_0RNSharedElementContent*) content contentMode:(UIViewContentMode) contentMode reverse:(BOOL)reverse;

@end

#endif
