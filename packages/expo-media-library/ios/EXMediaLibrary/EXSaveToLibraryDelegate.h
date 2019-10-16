// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXMediaLibrary/EXMediaLibrary.h>

typedef void(^EXSaveToLibraryCallback)(id asset, NSError *error);

@interface EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(EXSaveToLibraryCallback)callback;

- (void)writeVideo:(NSString *)movieUrl withCallback:(EXSaveToLibraryCallback) callback;

@end
