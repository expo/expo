// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXFontInterface/ABI30_0_0EXFontManagerInterface.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXAppLifecycleListener.h>

@interface ABI30_0_0EXReactFontManager : NSObject <ABI30_0_0EXFontManagerInterface, ABI30_0_0EXInternalModule, ABI30_0_0EXModuleRegistryConsumer, ABI30_0_0EXAppLifecycleListener>
@end
