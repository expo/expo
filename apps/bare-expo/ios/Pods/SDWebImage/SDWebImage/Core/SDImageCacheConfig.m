/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDImageCacheConfig.h"
#import "SDMemoryCache.h"
#import "SDDiskCache.h"

static SDImageCacheConfig *_defaultCacheConfig;
static const NSInteger kDefaultCacheMaxDiskAge = 60 * 60 * 24 * 7; // 1 week

@implementation SDImageCacheConfig

+ (SDImageCacheConfig *)defaultCacheConfig {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _defaultCacheConfig = [SDImageCacheConfig new];
    });
    return _defaultCacheConfig;
}

- (instancetype)init {
    if (self = [super init]) {
        _shouldDisableiCloud = YES;
        _shouldCacheImagesInMemory = YES;
        _shouldUseWeakMemoryCache = YES;
        _shouldRemoveExpiredDataWhenEnterBackground = YES;
        _diskCacheReadingOptions = 0;
        _diskCacheWritingOptions = NSDataWritingAtomic;
        _maxDiskAge = kDefaultCacheMaxDiskAge;
        _maxDiskSize = 0;
        _diskCacheExpireType = SDImageCacheConfigExpireTypeModificationDate;
        _memoryCacheClass = [SDMemoryCache class];
        _diskCacheClass = [SDDiskCache class];
    }
    return self;
}

- (id)copyWithZone:(NSZone *)zone {
    SDImageCacheConfig *config = [[[self class] allocWithZone:zone] init];
    config.shouldDisableiCloud = self.shouldDisableiCloud;
    config.shouldCacheImagesInMemory = self.shouldCacheImagesInMemory;
    config.shouldUseWeakMemoryCache = self.shouldUseWeakMemoryCache;
    config.shouldRemoveExpiredDataWhenEnterBackground = self.shouldRemoveExpiredDataWhenEnterBackground;
    config.diskCacheReadingOptions = self.diskCacheReadingOptions;
    config.diskCacheWritingOptions = self.diskCacheWritingOptions;
    config.maxDiskAge = self.maxDiskAge;
    config.maxDiskSize = self.maxDiskSize;
    config.maxMemoryCost = self.maxMemoryCost;
    config.maxMemoryCount = self.maxMemoryCount;
    config.diskCacheExpireType = self.diskCacheExpireType;
    config.fileManager = self.fileManager; // NSFileManager does not conform to NSCopying, just pass the reference
    config.memoryCacheClass = self.memoryCacheClass;
    config.diskCacheClass = self.diskCacheClass;
    
    return config;
}

@end
