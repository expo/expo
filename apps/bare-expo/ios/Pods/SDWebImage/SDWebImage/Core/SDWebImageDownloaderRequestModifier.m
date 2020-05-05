/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageDownloaderRequestModifier.h"

@interface SDWebImageDownloaderRequestModifier ()

@property (nonatomic, copy, nonnull) SDWebImageDownloaderRequestModifierBlock block;

@end

@implementation SDWebImageDownloaderRequestModifier

- (instancetype)initWithBlock:(SDWebImageDownloaderRequestModifierBlock)block {
    self = [super init];
    if (self) {
        self.block = block;
    }
    return self;
}

+ (instancetype)requestModifierWithBlock:(SDWebImageDownloaderRequestModifierBlock)block {
    SDWebImageDownloaderRequestModifier *requestModifier = [[SDWebImageDownloaderRequestModifier alloc] initWithBlock:block];
    return requestModifier;
}

- (NSURLRequest *)modifiedRequestWithRequest:(NSURLRequest *)request {
    if (!self.block) {
        return nil;
    }
    return self.block(request);
}

@end
