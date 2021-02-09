// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0EXMediaLibrary/ABI38_0_0EXMediaLibrary.h>

typedef void(^ABI38_0_0EXSaveToLibraryCallback)(id asset, NSError *error);

@interface ABI38_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI38_0_0EXSaveToLibraryCallback)callback;

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI38_0_0EXSaveToLibraryCallback) callback;

@end
