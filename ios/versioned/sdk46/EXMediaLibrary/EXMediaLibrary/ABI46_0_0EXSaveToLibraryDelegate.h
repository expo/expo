// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0EXMediaLibrary/ABI46_0_0EXMediaLibrary.h>

typedef void(^ABI46_0_0EXSaveToLibraryCallback)(id asset, NSError *error);

@interface ABI46_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI46_0_0EXSaveToLibraryCallback)callback;

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI46_0_0EXSaveToLibraryCallback) callback;

@end
