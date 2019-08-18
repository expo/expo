
#import <UIKit/UIKit.h>

@interface EXMenuGestureRecognizer : UIGestureRecognizer

/**
 *  True if it's possible to invoke the menu gesture and if the user has enabled the legacy menu gesture.
 */
+ (BOOL)isLegacyMenuGestureAvailable;

+ (NSTimeInterval)longPressDuration;

@end
