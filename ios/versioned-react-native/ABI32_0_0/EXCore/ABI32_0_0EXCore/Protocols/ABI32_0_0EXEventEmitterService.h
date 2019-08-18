// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXDefines.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>

@protocol ABI32_0_0EXEventEmitterService

- (void)sendEventWithName:(NSString *)name body:(id)body;

@end
