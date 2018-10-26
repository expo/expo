// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSession : NSObject

+ (instancetype)sharedInstance;

- (NSString * _Nullable)getSession;
- (NSString * _Nullable)getSessionSecret;
- (BOOL)saveSessionToKeychain:(NSString *)session error:(NSError **)error;
- (BOOL)deleteSessionFromKeychainWithError:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
