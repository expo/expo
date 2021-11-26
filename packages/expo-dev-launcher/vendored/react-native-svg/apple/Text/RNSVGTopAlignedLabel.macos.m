#import "RNSVGTopAlignedLabel.h"

@implementation RNSVGTopAlignedLabel

- (NSAttributedString *)attributedText
{
    return self.attributedString;
}

- (NSLineBreakMode)lineBreakMode
{
    return self.textContainer.lineBreakMode;
}

- (NSInteger)numberOfLines
{
    return self.textContainer.maximumNumberOfLines;
}

- (NSString *)text
{
    return self.string;
}

- (NSTextAlignment)textAlignment
{
    return self.alignment;
}

- (void)setAttributedText:(NSAttributedString *)attributedString
{
    [self.textStorage setAttributedString:attributedString];
}

- (void)setLineBreakMode:(NSLineBreakMode)lineBreakMode
{
    self.textContainer.lineBreakMode = lineBreakMode;
}

- (void)setNumberOfLines:(NSInteger)numberOfLines
{
    self.textContainer.maximumNumberOfLines = numberOfLines;
}

- (void)setText:(NSString *)text
{
    self.string = text;
}

- (void)setTextAlignment:(NSTextAlignment)textAlignment
{
    self.alignment = textAlignment;
}

@end
