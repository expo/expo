//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import "./ABI38_0_0UMFirebaseCoreInterface.h"
#import <Firebase/Firebase.h>

@interface ABI38_0_0EXFirebaseCore : ABI38_0_0UMExportedModule<ABI38_0_0UMFirebaseCoreInterface>

- (nonnull instancetype)init;
- (nonnull instancetype)initWithAppName:(nonnull NSString *)name options:(nullable FIROptions *)options;

- (BOOL)isAppAccessible:(nonnull NSString *)name;

- (nullable FIRApp *)defaultApp;

@end
