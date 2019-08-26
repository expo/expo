// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXDefines.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXInternalModule.h>

// Register a subclass of this class in ABI31_0_0EXModuleRegistryProvider
// to export an instance of this module to client code.
// Check documentation of the adapter appropriate to your platform
// to find out how to access constants and methods exported by the modules.

@interface ABI31_0_0EXExportedModule : NSObject <ABI31_0_0EXInternalModule, NSCopying>

- (NSDictionary *)constantsToExport;
+ (const NSString *)exportedModuleName;
- (NSDictionary<NSString *, NSString *> *)getExportedMethods;
- (void)callExportedMethod:(NSString *)methodName withArguments:(NSArray *)arguments resolver:(ABI31_0_0EXPromiseResolveBlock)resolver rejecter:(ABI31_0_0EXPromiseRejectBlock)rejecter;

- (dispatch_queue_t)methodQueue;

@end
