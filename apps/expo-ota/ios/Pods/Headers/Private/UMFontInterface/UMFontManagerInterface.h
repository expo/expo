// Copyright 2018-present 650 Industries. All rights reserved.
#import <UMFontInterface/UMFontProcessorInterface.h>

@protocol UMFontManagerInterface

- (void)addFontProcessor:(id<UMFontProcessorInterface>)processor;

@end
