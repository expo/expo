
#import <Foundation/Foundation.h>

@implementation UIColor (UIColor_Extension)

+ (UIColor *)LOT_colorWithHexString:(NSString *)stringToConvert {
  NSString *strippedString = [stringToConvert stringByReplacingOccurrencesOfString:@"#" withString:@""];
  NSScanner *scanner = [NSScanner scannerWithString:strippedString];
  unsigned hexNum;
  if (![scanner scanHexInt:&hexNum]) return nil;
  return [UIColor LOT_colorWithRGBHex:hexNum];
}

@end
