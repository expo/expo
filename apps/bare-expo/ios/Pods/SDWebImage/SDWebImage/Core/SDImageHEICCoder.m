/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import "SDImageHEICCoder.h"
#import "SDImageIOAnimatedCoderInternal.h"

// These constants are available from iOS 13+ and Xcode 11. This raw value is used for toolchain and firmware compatibility
static NSString * kSDCGImagePropertyHEICSDictionary = @"{HEICS}";
static NSString * kSDCGImagePropertyHEICSLoopCount = @"LoopCount";
static NSString * kSDCGImagePropertyHEICSDelayTime = @"DelayTime";
static NSString * kSDCGImagePropertyHEICSUnclampedDelayTime = @"UnclampedDelayTime";

@implementation SDImageHEICCoder

+ (void)initialize {
    if (@available(iOS 13, tvOS 13, macOS 10.15, watchOS 6, *)) {
        // Use SDK instead of raw value
        kSDCGImagePropertyHEICSDictionary = (__bridge NSString *)kCGImagePropertyHEICSDictionary;
        kSDCGImagePropertyHEICSLoopCount = (__bridge NSString *)kCGImagePropertyHEICSLoopCount;
        kSDCGImagePropertyHEICSDelayTime = (__bridge NSString *)kCGImagePropertyHEICSDelayTime;
        kSDCGImagePropertyHEICSUnclampedDelayTime = (__bridge NSString *)kCGImagePropertyHEICSUnclampedDelayTime;
    }
}

+ (instancetype)sharedCoder {
    static SDImageHEICCoder *coder;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        coder = [[SDImageHEICCoder alloc] init];
    });
    return coder;
}

#pragma mark - SDImageCoder

- (BOOL)canDecodeFromData:(nullable NSData *)data {
    switch ([NSData sd_imageFormatForImageData:data]) {
        case SDImageFormatHEIC:
            // Check HEIC decoding compatibility
            return [self.class canDecodeFromFormat:SDImageFormatHEIC];
        case SDImageFormatHEIF:
            // Check HEIF decoding compatibility
            return [self.class canDecodeFromFormat:SDImageFormatHEIF];
        default:
            return NO;
    }
}

- (BOOL)canIncrementalDecodeFromData:(NSData *)data {
    return [self canDecodeFromData:data];
}

- (BOOL)canEncodeToFormat:(SDImageFormat)format {
    switch (format) {
        case SDImageFormatHEIC:
            // Check HEIC encoding compatibility
            return [self.class canEncodeToFormat:SDImageFormatHEIC];
        case SDImageFormatHEIF:
            // Check HEIF encoding compatibility
            return [self.class canEncodeToFormat:SDImageFormatHEIF];
        default:
            return NO;
    }
}

#pragma mark - Subclass Override

+ (SDImageFormat)imageFormat {
    return SDImageFormatHEIC;
}

+ (NSString *)imageUTType {
    return (__bridge NSString *)kSDUTTypeHEIC;
}

+ (NSString *)dictionaryProperty {
    return kSDCGImagePropertyHEICSDictionary;
}

+ (NSString *)unclampedDelayTimeProperty {
    return kSDCGImagePropertyHEICSUnclampedDelayTime;
}

+ (NSString *)delayTimeProperty {
    return kSDCGImagePropertyHEICSDelayTime;
}

+ (NSString *)loopCountProperty {
    return kSDCGImagePropertyHEICSLoopCount;
}

+ (NSUInteger)defaultLoopCount {
    return 0;
}

@end
