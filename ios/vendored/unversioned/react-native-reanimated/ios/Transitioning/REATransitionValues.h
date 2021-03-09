#import <UIKit/UIKit.h>

@interface REATransitionValues : NSObject

@property (nonatomic) CGPoint center;
@property (nonatomic) CGRect bounds;
@property (nonatomic) CGPoint centerRelativeToRoot;
@property (nonatomic, retain) UIView *view;
@property (nonatomic, retain) UIView *parent;
@property (nonatomic, retain) UIView *reactParent;
@property (nonatomic) CGPoint centerInReactParent;

- (instancetype)initWithView:(UIView *)view forRoot:(UIView *)root;

@end
