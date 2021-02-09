/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDImageCodersManager.h"
#import "SDImageIOCoder.h"
#import "SDImageGIFCoder.h"
#import "SDImageAPNGCoder.h"
#import "SDImageHEICCoder.h"
#import "SDInternalMacros.h"

@interface SDImageCodersManager ()

@property (nonatomic, strong, nonnull) dispatch_semaphore_t codersLock;

@end

@implementation SDImageCodersManager
{
    NSMutableArray<id<SDImageCoder>> *_imageCoders;
}

+ (nonnull instancetype)sharedManager {
    static dispatch_once_t once;
    static id instance;
    dispatch_once(&once, ^{
        instance = [self new];
    });
    return instance;
}

- (instancetype)init {
    if (self = [super init]) {
        // initialize with default coders
        _imageCoders = [NSMutableArray arrayWithArray:@[[SDImageIOCoder sharedCoder], [SDImageGIFCoder sharedCoder], [SDImageAPNGCoder sharedCoder]]];
        _codersLock = dispatch_semaphore_create(1);
    }
    return self;
}

- (NSArray<id<SDImageCoder>> *)coders
{
    SD_LOCK(self.codersLock);
    NSArray<id<SDImageCoder>> *coders = [_imageCoders copy];
    SD_UNLOCK(self.codersLock);
    return coders;
}

- (void)setCoders:(NSArray<id<SDImageCoder>> *)coders
{
    SD_LOCK(self.codersLock);
    [_imageCoders removeAllObjects];
    if (coders.count) {
        [_imageCoders addObjectsFromArray:coders];
    }
    SD_UNLOCK(self.codersLock);
}

#pragma mark - Coder IO operations

- (void)addCoder:(nonnull id<SDImageCoder>)coder {
    if (![coder conformsToProtocol:@protocol(SDImageCoder)]) {
        return;
    }
    SD_LOCK(self.codersLock);
    [_imageCoders addObject:coder];
    SD_UNLOCK(self.codersLock);
}

- (void)removeCoder:(nonnull id<SDImageCoder>)coder {
    if (![coder conformsToProtocol:@protocol(SDImageCoder)]) {
        return;
    }
    SD_LOCK(self.codersLock);
    [_imageCoders removeObject:coder];
    SD_UNLOCK(self.codersLock);
}

#pragma mark - SDImageCoder
- (BOOL)canDecodeFromData:(NSData *)data {
    NSArray<id<SDImageCoder>> *coders = self.coders;
    for (id<SDImageCoder> coder in coders.reverseObjectEnumerator) {
        if ([coder canDecodeFromData:data]) {
            return YES;
        }
    }
    return NO;
}

- (BOOL)canEncodeToFormat:(SDImageFormat)format {
    NSArray<id<SDImageCoder>> *coders = self.coders;
    for (id<SDImageCoder> coder in coders.reverseObjectEnumerator) {
        if ([coder canEncodeToFormat:format]) {
            return YES;
        }
    }
    return NO;
}

- (UIImage *)decodedImageWithData:(NSData *)data options:(nullable SDImageCoderOptions *)options {
    if (!data) {
        return nil;
    }
    UIImage *image;
    NSArray<id<SDImageCoder>> *coders = self.coders;
    for (id<SDImageCoder> coder in coders.reverseObjectEnumerator) {
        if ([coder canDecodeFromData:data]) {
            image = [coder decodedImageWithData:data options:options];
            break;
        }
    }
    
    return image;
}

- (NSData *)encodedDataWithImage:(UIImage *)image format:(SDImageFormat)format options:(nullable SDImageCoderOptions *)options {
    if (!image) {
        return nil;
    }
    NSArray<id<SDImageCoder>> *coders = self.coders;
    for (id<SDImageCoder> coder in coders.reverseObjectEnumerator) {
        if ([coder canEncodeToFormat:format]) {
            return [coder encodedDataWithImage:image format:format options:options];
        }
    }
    return nil;
}

@end
