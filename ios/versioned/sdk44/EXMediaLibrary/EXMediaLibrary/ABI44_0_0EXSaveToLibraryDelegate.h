// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0EXMediaLibrary/ABI44_0_0EXMediaLibrary.h>

typedef void(^ABI44_0_0EXSaveToLibraryCallback)(id asset, NSError *error);

@interface ABI44_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI44_0_0EXSaveToLibraryCallback)callback;

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI44_0_0EXSaveToLibraryCallback) callback;

@end
