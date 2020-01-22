// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXLocalAuthentication/EXLocalAuthentication.h>)
#import <EXLocalAuthentication/EXLocalAuthentication.h>
#import <UMCore/UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedLocalAuthentication : EXLocalAuthentication <UMModuleRegistryConsumer>

@end

NS_ASSUME_NONNULL_END
#endif
