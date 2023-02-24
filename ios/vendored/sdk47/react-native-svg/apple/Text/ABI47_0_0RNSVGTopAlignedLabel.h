#if TARGET_OS_OSX
#import <ABI47_0_0React/ABI47_0_0RCTTextView.h>
@interface ABI47_0_0RNSVGTopAlignedLabel : NSTextView

@property NSAttributedString *attributedText;
@property NSLineBreakMode lineBreakMode;
@property NSInteger numberOfLines;
@property NSString *text;
@property NSTextAlignment textAlignment;
#else
@interface ABI47_0_0RNSVGTopAlignedLabel : UILabel
#endif
@end
