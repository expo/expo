// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>

@interface ABI48_0_0EXErrorRecoveryModule : ABI48_0_0EXExportedModule

- (NSString *)userDefaultsKey;

- (BOOL)setRecoveryProps:(NSString *)props;

- (NSString *)consumeRecoveryProps;

@end
