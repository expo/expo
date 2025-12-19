// Copyright 2023-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Forward declaration of EXRegisterModule
extern void EXRegisterModule(Class);

// Helper class to register FileSystemManager at load time
@interface EXFileSystemManagerRegistration : NSObject
@end

@implementation EXFileSystemManagerRegistration

+ (void)load {
  // Use NSClassFromString for late binding to avoid linker dependency on Swift class
  Class fileSystemClass = NSClassFromString(@"EXFileSystemLegacyUtilities");
  if (fileSystemClass) {
    EXRegisterModule(fileSystemClass);
  }
}

@end
