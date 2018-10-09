// Copyright 2018-present 650 Industries. All rights reserved.
#import <EXFontInterface/EXFontProcessorInterface.h>

@protocol EXFontManagerInterface

- (void)addFontProccessor:(id<EXFontProcessorInterface>)processor;

@end
