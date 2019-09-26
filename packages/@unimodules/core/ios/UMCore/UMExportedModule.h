// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMInternalModule.h>

// Register a subclass of this class in UMModuleRegistryProvider
// to export an instance of this module to client code.
// Check documentation of the adapter appropriate to your platform
// to find out how to access constants and methods exported by the modules.

@interface UMExportedModule : NSObject <UMInternalModule, NSCopying>

- (NSDictionary *)constantsToExport;
+ (const NSString *)exportedModuleName;
- (NSDictionary<NSString *, NSString *> *)getExportedMethods;
- (void)callExportedMethod:(NSString *)methodName withArguments:(NSArray *)arguments resolver:(UMPromiseResolveBlock)resolver rejecter:(UMPromiseRejectBlock)rejecter;

- (dispatch_queue_t)methodQueue;

@end
