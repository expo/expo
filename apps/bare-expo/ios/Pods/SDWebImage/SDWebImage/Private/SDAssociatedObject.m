/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import "SDAssociatedObject.h"
#import "UIImage+Metadata.h"
#import "UIImage+ExtendedCacheData.h"
#import "UIImage+MemoryCacheCost.h"
#import "UIImage+ForceDecode.h"

void SDImageCopyAssociatedObject(UIImage * _Nullable source, UIImage * _Nullable target) {
    if (!source || !target) {
        return;
    }
    // Image Metadata
    target.sd_isIncremental = source.sd_isIncremental;
    target.sd_imageLoopCount = source.sd_imageLoopCount;
    target.sd_imageFormat = source.sd_imageFormat;
    // Force Decode
    target.sd_isDecoded = source.sd_isDecoded;
    // Extended Cache Data
    target.sd_extendedObject = source.sd_extendedObject;
}
