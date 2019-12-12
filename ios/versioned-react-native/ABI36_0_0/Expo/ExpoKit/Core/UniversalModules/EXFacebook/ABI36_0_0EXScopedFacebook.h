// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI36_0_0EXFacebook/ABI36_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI36_0_0EXFacebook/ABI36_0_0EXFacebook.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMAppLifecycleListener.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

@interface ABI36_0_0EXScopedFacebook : ABI36_0_0EXFacebook <ABI36_0_0UMAppLifecycleListener, ABI36_0_0UMModuleRegistryConsumer>

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
