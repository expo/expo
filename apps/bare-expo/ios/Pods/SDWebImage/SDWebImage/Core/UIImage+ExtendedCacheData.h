/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
* (c) Fabrice Aneche
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import <Foundation/Foundation.h>
#import "SDWebImageCompat.h"

@interface UIImage (ExtendedCacheData)

/**
 Read and Write the extended object and bind it to the image. Which can hold some extra metadata like Image's scale factor, URL rich link, date, etc.
 The extended object should conforms to NSCoding, which we use `NSKeyedArchiver` and `NSKeyedUnarchiver` to archive it to data, and write to disk cache.
 @note The disk cache preserve both of the data and extended data with the same cache key. For manual query, use the `SDDiskCache` protocol method `extendedDataForKey:` instead.
 @note You can specify arbitrary object conforms to NSCoding (NSObject protocol here is used to support object using `NS_ROOT_CLASS`, which is not NSObject subclass). If you load image from disk cache, you should check the extended object class to avoid corrupted data.
 @warning This object don't need to implements NSSecureCoding (but it's recommended),  because we allows arbitrary class.
 */
@property (nonatomic, strong, nullable) id<NSObject, NSCoding> sd_extendedObject;

@end
