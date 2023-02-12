// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0EXMediaLibrary/ABI47_0_0EXMediaLibrary.h>

typedef void(^ABI47_0_0EXSaveToLibraryCallback)(id asset, NSError *error);

@interface ABI47_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI47_0_0EXSaveToLibraryCallback)callback;

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI47_0_0EXSaveToLibraryCallback) callback;

@end
