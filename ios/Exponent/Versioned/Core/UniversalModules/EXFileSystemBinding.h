// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXFileSystem/EXFileSystemManagerService.h>

@interface EXFileSystemBinding : EXFileSystemManagerService <EXModuleRegistryConsumer>

@end
