// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXAppLifecycleListener.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXFontLoader : EXExportedModule <EXModuleRegistryConsumer, EXAppLifecycleListener>

@end
