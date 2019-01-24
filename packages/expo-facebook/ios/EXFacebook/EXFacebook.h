// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXFacebook : EXExportedModule <EXModuleRegistryConsumer>

+ (id)facebookAppIdFromNSBundle;

@end
