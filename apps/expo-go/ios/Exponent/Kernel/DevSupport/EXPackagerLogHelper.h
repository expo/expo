// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Utility class for sending logs directly to the packager using WebSockets,
 bypassing the standard JavaScript logging APIs.

 Establishes a WebSocket connection to the packager, waits until it's ready,
 and then transmits the log message.

 Designed for fire-and-forget usage—errors during logging are not propagated,
 as reliability isn't critical in this context.
 */
@interface EXPackagerLogHelper : NSObject

+ (void) logInfo:(NSString*) message withBundleUrl:(NSURL*)url;
+ (void) logWarning:(NSString*) message withBundleUrl:(NSURL*)url;
+ (void) logError:(NSString*) message withBundleUrl:(NSURL*)url;

@end

NS_ASSUME_NONNULL_END
