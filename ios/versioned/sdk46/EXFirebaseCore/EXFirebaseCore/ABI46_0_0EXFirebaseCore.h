//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0EXFirebaseCore/ABI46_0_0EXFirebaseCoreInterface.h>
#import <Firebase/Firebase.h>

@interface ABI46_0_0EXFirebaseCore : ABI46_0_0EXExportedModule<ABI46_0_0EXFirebaseCoreInterface>

- (nonnull instancetype)init;
- (nonnull instancetype)initWithAppName:(nonnull NSString *)name options:(nullable FIROptions *)options;

- (BOOL)isAppAccessible:(nonnull NSString *)name;

- (nullable FIRApp *)defaultApp;

@end
