/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/


#import "SDWebImageDownloaderResponseModifier.h"

@interface SDWebImageDownloaderResponseModifier ()

@property (nonatomic, copy, nonnull) SDWebImageDownloaderResponseModifierBlock block;

@end

@implementation SDWebImageDownloaderResponseModifier

- (instancetype)initWithBlock:(SDWebImageDownloaderResponseModifierBlock)block {
    self = [super init];
    if (self) {
        self.block = block;
    }
    return self;
}

+ (instancetype)responseModifierWithBlock:(SDWebImageDownloaderResponseModifierBlock)block {
    SDWebImageDownloaderResponseModifier *responseModifier = [[SDWebImageDownloaderResponseModifier alloc] initWithBlock:block];
    return responseModifier;
}

- (nullable NSURLResponse *)modifiedResponseWithResponse:(nonnull NSURLResponse *)response {
    if (!self.block) {
        return nil;
    }
    return self.block(response);
}

@end
