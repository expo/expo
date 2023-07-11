// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI49_0_0EXMediaLibrary/ABI49_0_0EXMediaLibrary.h>

typedef void(^ABI49_0_0EXSaveToLibraryCallback)(id asset, NSError *error);

@interface ABI49_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI49_0_0EXSaveToLibraryCallback)callback;

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI49_0_0EXSaveToLibraryCallback) callback;

- (void)writeGIF:(NSURL *)gifUrl withCallback:(ABI49_0_0EXSaveToLibraryCallback)callback;

@end
