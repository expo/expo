// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>

#import <ABI31_0_0EXCore/ABI31_0_0EXEventEmitter.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXExportedModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXAppLifecycleListener.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>

@interface ABI31_0_0EXLocation : ABI31_0_0EXExportedModule <ABI31_0_0EXAppLifecycleListener, ABI31_0_0EXEventEmitter, ABI31_0_0EXModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;

@end
