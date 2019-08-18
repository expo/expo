#import <UIKit/UIKit.h>

@interface ABI33_0_0REATransitionValues : NSObject

@property (nonatomic) CGPoint center;
@property (nonatomic) CGRect bounds;
@property (nonatomic) CGPoint centerRelativeToRoot;
@property (nonatomic, retain) UIView *view;
@property (nonatomic, retain) UIView *parent;
@property (nonatomic, retain) UIView *ReactABI33_0_0Parent;
@property (nonatomic) CGPoint centerInReactABI33_0_0Parent;

- (instancetype)initWithView:(UIView *)view forRoot:(UIView *)root;

@end
