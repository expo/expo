//  Copyright © 2019 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTMultipartStreamReader.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Fork of {@link RCTMultipartStreamReader} that doesn't necessarily
 * expect a preamble (first boundary is not necessarily preceded by CRLF).
 */
@interface EXUpdatesMultipartStreamReader : NSObject

- (instancetype)initWithInputStream:(NSInputStream *)stream boundary:(NSString *)boundary;
- (BOOL)readAllPartsWithCompletionCallback:(RCTMultipartCallback)callback;

@end

NS_ASSUME_NONNULL_END
