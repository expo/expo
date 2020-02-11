//  Copyright © 2020 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import "./UMFirebaseCoreInterface.h"
#import <Firebase/Firebase.h>

@interface EXFirebaseCore : UMExportedModule<UMFirebaseCoreInterface>

- (nonnull instancetype) init;
- (nonnull instancetype) initWithAppName:(nonnull NSString*)name options:(nullable FIROptions*)options;

- (BOOL) isAppAccessible:(nonnull NSString*)name;

- (nullable FIRApp *)defaultApp;

@end
