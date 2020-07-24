// Copyright 2018-present 650 Industries. All rights reserved.
#import <EDUMFontProcessorInterface.h>

@protocol EDUMFontManagerInterface

- (void)addFontProcessor:(id<EDUMFontProcessorInterface>)processor;

@end
