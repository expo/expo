#import "UIViewController+CreateExtension.h"

@implementation UIViewController (CreateExtension)

- (instancetype)initWithView:(UIView *)view {
    if (self = [self init]) {
        self.view = view;
    }
    return self;
}

@end
