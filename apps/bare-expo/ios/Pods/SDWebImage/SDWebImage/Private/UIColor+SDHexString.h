/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"

@interface UIColor (SDHexString)

/**
 Convenience way to get hex string from color. The output should always be 32-bit RGBA hex string like `#00000000`.
 */
@property (nonatomic, copy, readonly, nonnull) NSString *sd_hexString;

@end
