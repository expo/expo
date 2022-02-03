// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTPackagerConnection.h>

#if RCT_DEV

NS_ASSUME_NONNULL_BEGIN

@interface RCTPackagerConnection (EXDevLauncherPackagerConnectionInterceptor)

- (void)setSocketConnectionURL:(NSURL *)url;

@end

NS_ASSUME_NONNULL_END

#endif
