// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXFacebook/ABI40_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI40_0_0EXFacebook/ABI40_0_0EXFacebook.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppLifecycleListener.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

@interface ABI40_0_0EXScopedFacebook : ABI40_0_0EXFacebook <ABI40_0_0UMAppLifecycleListener, ABI40_0_0UMModuleRegistryConsumer>

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
