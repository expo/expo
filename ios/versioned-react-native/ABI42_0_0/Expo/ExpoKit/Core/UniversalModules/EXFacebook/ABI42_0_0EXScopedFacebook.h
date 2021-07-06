// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXFacebook/ABI42_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI42_0_0EXFacebook/ABI42_0_0EXFacebook.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleListener.h>

@interface ABI42_0_0EXScopedFacebook : ABI42_0_0EXFacebook <ABI42_0_0UMAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey andParams:(NSDictionary *)params;

@end
#endif
