// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

// Register a subclass of this class in EXModuleRegistryProvider
// to export an instance of this module to client code.
// Check documentation of the adapter appropriate to your platform
// to find out how to access constants and methods exported by the modules.

@interface EXExportedModule : NSObject <EXInternalModule, NSCopying>

- (NSDictionary *)constantsToExport;
+ (const NSString *)exportedModuleName;
- (NSDictionary<NSString *, NSString *> *)getExportedMethods;
- (void)callExportedMethod:(NSString *)methodName withArguments:(NSArray *)arguments resolver:(EXPromiseResolveBlock)resolver rejecter:(EXPromiseRejectBlock)rejecter;

- (dispatch_queue_t)methodQueue;

@end

NS_ASSUME_NONNULL_END
