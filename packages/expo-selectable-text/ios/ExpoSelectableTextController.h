#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Adds range selection and menu items to the React Native `Text` paragraphs
 * inside a host view. React Native still lays out, draws, and handles touches.
 */
@interface ExpoSelectableTextController : NSObject

- (instancetype)initWithHostView:(UIView *)hostView NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

// Items of the shape `{ id: string, title: string }`, shown before the system items.
@property (nonatomic, copy) NSArray<NSDictionary *> *menuItems;

@property (nonatomic, copy, nullable) void (^onMenuAction)
    (NSString *actionId, NSString *selectedText, NSInteger start, NSInteger end);

// Called from the host's `hitTest:withEvent:`, before UIKit assigns the touch.
- (void)prepareForTouchAtPoint:(CGPoint)point withEvent:(nullable UIEvent *)event;

- (void)reset;

@end

NS_ASSUME_NONNULL_END
