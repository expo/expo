// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI48_0_0EXMediaLibrary/ABI48_0_0EXMediaLibrary.h>

typedef void(^ABI48_0_0EXSaveToLibraryCallback)(id asset, NSError *error);

@interface ABI48_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI48_0_0EXSaveToLibraryCallback)callback;

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI48_0_0EXSaveToLibraryCallback) callback;

@end
