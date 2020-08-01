#import <UIKit/UIKit.h>
#import "SEGSerializableValue.h"

/** Implement this protocol to override automatic screen reporting
 */

NS_ASSUME_NONNULL_BEGIN

@protocol SEGScreenReporting
@optional
-(void) seg_trackScreen:(UIViewController*)screen name:(NSString*)name;
@property (readonly, nullable) UIViewController *seg_mainViewController;
@end

NS_ASSUME_NONNULL_END


