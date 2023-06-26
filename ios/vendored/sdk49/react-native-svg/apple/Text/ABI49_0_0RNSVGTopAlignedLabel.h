#if TARGET_OS_OSX
#import <ABI49_0_0React/ABI49_0_0RCTTextView.h>
@interface ABI49_0_0RNSVGTopAlignedLabel : NSTextView

@property NSAttributedString *attributedText;
@property NSLineBreakMode lineBreakMode;
@property NSInteger numberOfLines;
@property NSString *text;
@property NSTextAlignment textAlignment;
#else
#import <UIKit/UIKit.h>
@interface ABI49_0_0RNSVGTopAlignedLabel : UILabel
#endif
@end
