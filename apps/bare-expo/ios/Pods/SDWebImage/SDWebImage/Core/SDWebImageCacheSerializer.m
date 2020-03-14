/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCacheSerializer.h"

@interface SDWebImageCacheSerializer ()

@property (nonatomic, copy, nonnull) SDWebImageCacheSerializerBlock block;

@end

@implementation SDWebImageCacheSerializer

- (instancetype)initWithBlock:(SDWebImageCacheSerializerBlock)block {
    self = [super init];
    if (self) {
        self.block = block;
    }
    return self;
}

+ (instancetype)cacheSerializerWithBlock:(SDWebImageCacheSerializerBlock)block {
    SDWebImageCacheSerializer *cacheSerializer = [[SDWebImageCacheSerializer alloc] initWithBlock:block];
    return cacheSerializer;
}

- (NSData *)cacheDataWithImage:(UIImage *)image originalData:(NSData *)data imageURL:(nullable NSURL *)imageURL {
    if (!self.block) {
        return nil;
    }
    return self.block(image, data, imageURL);
}

@end
