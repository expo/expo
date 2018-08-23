// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFontInterface/EXFontManagerInterface.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXAppLifecycleListener.h>

@interface EXReactFontManager : NSObject <EXFontManagerInterface, EXInternalModule, EXModuleRegistryConsumer, EXAppLifecycleListener>
@end
