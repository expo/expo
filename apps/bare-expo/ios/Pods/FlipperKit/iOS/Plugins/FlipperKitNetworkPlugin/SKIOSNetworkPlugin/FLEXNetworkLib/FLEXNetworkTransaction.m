/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FLEXNetworkTransaction.h"

@interface FLEXNetworkTransaction ()

@property(nonatomic, strong, readwrite) NSData* cachedRequestBody;

@end

@implementation FLEXNetworkTransaction

- (NSString*)description {
  NSString* description = [super description];

  description =
      [description stringByAppendingFormat:@" id = %@;", self.requestID];
  description =
      [description stringByAppendingFormat:@" url = %@;", self.request.URL];
  description =
      [description stringByAppendingFormat:@" duration = %f;", self.duration];
  description =
      [description stringByAppendingFormat:@" receivedDataLength = %lld",
                                           self.receivedDataLength];

  return description;
}

- (NSData*)cachedRequestBody {
  if (!_cachedRequestBody) {
    if (self.request.HTTPBody != nil) {
      _cachedRequestBody = self.request.HTTPBody;
    } else if ([self.request.HTTPBodyStream
                   conformsToProtocol:@protocol(NSCopying)]) {
      NSInputStream* bodyStream = [self.request.HTTPBodyStream copy];
      const NSUInteger bufferSize = 1024;
      uint8_t buffer[bufferSize];
      NSMutableData* data = [NSMutableData data];
      [bodyStream open];
      NSInteger readBytes = 0;
      do {
        readBytes = [bodyStream read:buffer maxLength:bufferSize];
        [data appendBytes:buffer length:readBytes];
      } while (readBytes > 0);
      [bodyStream close];
      _cachedRequestBody = data;
    }
  }
  return _cachedRequestBody;
}

+ (NSString*)readableStringFromTransactionState:
    (FLEXNetworkTransactionState)state {
  NSString* readableString = nil;
  switch (state) {
    case FLEXNetworkTransactionStateUnstarted:
      readableString = @"Unstarted";
      break;

    case FLEXNetworkTransactionStateAwaitingResponse:
      readableString = @"Awaiting Response";
      break;

    case FLEXNetworkTransactionStateReceivingData:
      readableString = @"Receiving Data";
      break;

    case FLEXNetworkTransactionStateFinished:
      readableString = @"Finished";
      break;

    case FLEXNetworkTransactionStateFailed:
      readableString = @"Failed";
      break;
  }
  return readableString;
}

@end
