// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXClipboard/EXClipboardModule.h>

@interface EXClipboardModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXClipboardModule

UM_EXPORT_MODULE(ExpoClipboard);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
