/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"

/**
 UIImage category for memory cache cost.
 */
@interface UIImage (MemoryCacheCost)

/**
 The memory cache cost for specify image used by image cache. The cost function is the bytes size held in memory.
 If you set some associated object to `UIImage`, you can set the custom value to indicate the memory cost.
 
 For `UIImage`, this method return the single frame bytes size when `image.images` is nil for static image. Retuen full frame bytes size when `image.images` is not nil for animated image.
 For `NSImage`, this method return the single frame bytes size because `NSImage` does not store all frames in memory.
 @note Note that because of the limitations of category this property can get out of sync if you create another instance with CGImage or other methods.
 @note For custom animated class conforms to `SDAnimatedImage`, you can override this getter method in your subclass to return a more proper value instead, which representing the current frame's total bytes.
 */
@property (assign, nonatomic) NSUInteger sd_memoryCost;

@end
