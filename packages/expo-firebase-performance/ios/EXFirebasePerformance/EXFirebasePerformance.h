// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXFirebasePerformance : EXExportedModule <EXModuleRegistryConsumer>

@property NSMutableDictionary *traces;
@property NSMutableDictionary *httpMetrics;

@end
