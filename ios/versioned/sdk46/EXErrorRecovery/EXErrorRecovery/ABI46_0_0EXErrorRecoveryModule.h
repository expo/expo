// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>

@interface ABI46_0_0EXErrorRecoveryModule : ABI46_0_0EXExportedModule

- (NSString *)userDefaultsKey;

- (BOOL)setRecoveryProps:(NSString *)props;

- (NSString *)consumeRecoveryProps;

@end
