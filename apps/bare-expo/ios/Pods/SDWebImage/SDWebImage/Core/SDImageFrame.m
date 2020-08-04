/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDImageFrame.h"

@interface SDImageFrame ()

@property (nonatomic, strong, readwrite, nonnull) UIImage *image;
@property (nonatomic, readwrite, assign) NSTimeInterval duration;

@end

@implementation SDImageFrame

+ (instancetype)frameWithImage:(UIImage *)image duration:(NSTimeInterval)duration {
    SDImageFrame *frame = [[SDImageFrame alloc] init];
    frame.image = image;
    frame.duration = duration;
    
    return frame;
}

@end
