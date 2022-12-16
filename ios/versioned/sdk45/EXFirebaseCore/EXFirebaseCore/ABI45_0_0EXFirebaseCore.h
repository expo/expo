//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0EXFirebaseCore/ABI45_0_0EXFirebaseCoreInterface.h>
#import <Firebase/Firebase.h>

@interface ABI45_0_0EXFirebaseCore : ABI45_0_0EXExportedModule<ABI45_0_0EXFirebaseCoreInterface>

- (nonnull instancetype)init;
- (nonnull instancetype)initWithAppName:(nonnull NSString *)name options:(nullable FIROptions *)options;

- (BOOL)isAppAccessible:(nonnull NSString *)name;

- (nullable FIRApp *)defaultApp;

@end
