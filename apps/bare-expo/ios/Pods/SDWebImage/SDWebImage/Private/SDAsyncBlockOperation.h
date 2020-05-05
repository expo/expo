/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"

@class SDAsyncBlockOperation;
typedef void (^SDAsyncBlock)(SDAsyncBlockOperation * __nonnull asyncOperation);

@interface SDAsyncBlockOperation : NSOperation

- (nonnull instancetype)initWithBlock:(nonnull SDAsyncBlock)block;
+ (nonnull instancetype)blockOperationWithBlock:(nonnull SDAsyncBlock)block;
- (void)complete;

@end
