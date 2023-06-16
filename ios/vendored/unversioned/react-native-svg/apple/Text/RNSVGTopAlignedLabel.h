#if TARGET_OS_OSX
#import <React/RCTTextView.h>
@interface RNSVGTopAlignedLabel : NSTextView

@property NSAttributedString *attributedText;
@property NSLineBreakMode lineBreakMode;
@property NSInteger numberOfLines;
@property NSString *text;
@property NSTextAlignment textAlignment;
#else
#import <UIKit/UIKit.h>
@interface RNSVGTopAlignedLabel : UILabel
#endif
@end
