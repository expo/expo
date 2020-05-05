/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "UIColor+HexString.h"

@implementation UIColor (HexString)

- (NSString *)sd_hexString {
    CGFloat red, green, blue, alpha;
#if SD_UIKIT
    if (![self getRed:&red green:&green blue:&blue alpha:&alpha]) {
        [self getWhite:&red alpha:&alpha];
        green = red;
        blue = red;
    }
#else
    @try {
        [self getRed:&red green:&green blue:&blue alpha:&alpha];
    }
    @catch (NSException *exception) {
        [self getWhite:&red alpha:&alpha];
        green = red;
        blue = red;
    }
#endif
    
    red = roundf(red * 255.f);
    green = roundf(green * 255.f);
    blue = roundf(blue * 255.f);
    alpha = roundf(alpha * 255.f);
    
    uint hex = ((uint)alpha << 24) | ((uint)red << 16) | ((uint)green << 8) | ((uint)blue);
    
    return [NSString stringWithFormat:@"#%08x", hex];
}

@end
