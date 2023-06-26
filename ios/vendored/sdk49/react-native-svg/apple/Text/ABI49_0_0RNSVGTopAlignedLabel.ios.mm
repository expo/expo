#import "ABI49_0_0RNSVGTopAlignedLabel.h"

@implementation ABI49_0_0RNSVGTopAlignedLabel

- (void)drawTextInRect:(CGRect)rect
{
  NSAttributedString *attributedText = [[NSAttributedString alloc] initWithString:self.text
                                                                       attributes:@{NSFontAttributeName : self.font}];
  rect.size.height = [attributedText boundingRectWithSize:rect.size
                                                  options:NSStringDrawingUsesLineFragmentOrigin
                                                  context:nil]
                         .size.height;
  if (self.numberOfLines != 0) {
    rect.size.height = MIN(rect.size.height, self.numberOfLines * self.font.lineHeight);
  }
  [super drawTextInRect:rect];
}

@end
