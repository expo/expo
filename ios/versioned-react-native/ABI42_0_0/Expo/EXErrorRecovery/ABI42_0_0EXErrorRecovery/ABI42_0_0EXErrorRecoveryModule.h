// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

@interface ABI42_0_0EXErrorRecoveryModule : ABI42_0_0UMExportedModule

- (NSString *)userDefaultsKey;

- (BOOL)setRecoveryProps:(NSString *)props;

- (NSString *)consumeRecoveryProps;

@end
