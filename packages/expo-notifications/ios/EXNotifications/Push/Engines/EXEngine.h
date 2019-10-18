// Copyright 2019-present 650 Industries. All rights reserved.

#ifndef EXEngine_h
#define EXEngine_h

@protocol EXEngine <NSObject>

- (NSString *)generateTokenForAppId:(NSString*)appId withToken:(NSString*)token;

- (void)sendTokenToServer:(NSString*)token;

@end

#endif /* EXEngine_h */
