//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import "./ABI41_0_0UMFirebaseCoreInterface.h"
#import <Firebase/Firebase.h>

@interface ABI41_0_0EXFirebaseCore : ABI41_0_0UMExportedModule<ABI41_0_0UMFirebaseCoreInterface>

- (nonnull instancetype)init;
- (nonnull instancetype)initWithAppName:(nonnull NSString *)name options:(nullable FIROptions *)options;

- (BOOL)isAppAccessible:(nonnull NSString *)name;

- (nullable FIRApp *)defaultApp;

@end
