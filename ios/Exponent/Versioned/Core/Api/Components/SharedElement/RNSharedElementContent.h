//
//  RNSharedElementContent_h
//  react-native-shared-element
//

#ifndef RNSharedElementContent_h
#define RNSharedElementContent_h

#import <UIKit/UIKit.h>
#import "RNSharedElementTypes.h"

@interface RNSharedElementContent : NSObject
@property (nonatomic, readonly) id data;
@property (nonatomic, readonly) RNSharedElementContentType type;
@property (nonatomic, readonly) UIEdgeInsets insets;

- (instancetype)initWithData:(id) data type:(RNSharedElementContentType)type insets:(UIEdgeInsets)insets;
- (NSString*) typeName;

+ (BOOL) isKindOfImageView:(UIView*) view;
+ (UIImageView*) imageViewFromView:(UIView*) view;

+ (CGRect) layoutForRect:(CGRect)layout content:(RNSharedElementContent*) content contentMode:(UIViewContentMode) contentMode reverse:(BOOL)reverse;

@end

#endif
