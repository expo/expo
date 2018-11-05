// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>

#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitter.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXAppLifecycleListener.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>

@interface ABI30_0_0EXLocation : ABI30_0_0EXExportedModule <ABI30_0_0EXAppLifecycleListener, ABI30_0_0EXEventEmitter, ABI30_0_0EXModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;

@end
