// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI39_0_0EXFacebook/ABI39_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI39_0_0EXFacebook/ABI39_0_0EXFacebook.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppLifecycleListener.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

@interface ABI39_0_0EXScopedFacebook : ABI39_0_0EXFacebook <ABI39_0_0UMAppLifecycleListener, ABI39_0_0UMModuleRegistryConsumer>

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
