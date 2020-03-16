/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDImageAPNGCoder.h"
#if SD_MAC
#import <CoreServices/CoreServices.h>
#else
#import <MobileCoreServices/MobileCoreServices.h>
#endif

// iOS 8 Image/IO framework binary does not contains these APNG contants, so we define them. Thanks Apple :)
// We can not use runtime @available check for this issue, because it's a global symbol and should be loaded during launch time by dyld. So hack if the min deployment target version < iOS 9.0, whatever it running on iOS 9+ or not.
#if (__IPHONE_OS_VERSION_MIN_REQUIRED && __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_9_0)
const CFStringRef kCGImagePropertyAPNGLoopCount = (__bridge CFStringRef)@"LoopCount";
const CFStringRef kCGImagePropertyAPNGDelayTime = (__bridge CFStringRef)@"DelayTime";
const CFStringRef kCGImagePropertyAPNGUnclampedDelayTime = (__bridge CFStringRef)@"UnclampedDelayTime";
#endif

@implementation SDImageAPNGCoder

+ (instancetype)sharedCoder {
    static SDImageAPNGCoder *coder;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        coder = [[SDImageAPNGCoder alloc] init];
    });
    return coder;
}

#pragma mark - Subclass Override

+ (SDImageFormat)imageFormat {
    return SDImageFormatPNG;
}

+ (NSString *)imageUTType {
    return (__bridge NSString *)kUTTypePNG;
}

+ (NSString *)dictionaryProperty {
    return (__bridge NSString *)kCGImagePropertyPNGDictionary;
}

+ (NSString *)unclampedDelayTimeProperty {
    return (__bridge NSString *)kCGImagePropertyAPNGUnclampedDelayTime;
}

+ (NSString *)delayTimeProperty {
    return (__bridge NSString *)kCGImagePropertyAPNGDelayTime;
}

+ (NSString *)loopCountProperty {
    return (__bridge NSString *)kCGImagePropertyAPNGLoopCount;
}

+ (NSUInteger)defaultLoopCount {
    return 0;
}

@end
