// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <EXFileSystem/EXFileSystemManagerService.h>

@interface EXFileSystemBinding : EXFileSystemManagerService <UMModuleRegistryConsumer>

@end
