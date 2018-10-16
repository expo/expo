// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>

#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXExportedModule.h>
#import <EXCore/EXAppLifecycleListener.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXLocation : EXExportedModule <EXAppLifecycleListener, EXEventEmitter, EXModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;

@end
