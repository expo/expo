// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0EXMediaLibrary/ABI45_0_0EXMediaLibrary.h>

typedef void(^ABI45_0_0EXSaveToLibraryCallback)(id asset, NSError *error);

@interface ABI45_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI45_0_0EXSaveToLibraryCallback)callback;

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI45_0_0EXSaveToLibraryCallback) callback;

@end
