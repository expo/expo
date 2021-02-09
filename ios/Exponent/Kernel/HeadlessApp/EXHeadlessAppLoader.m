// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXHeadlessAppLoader.h"
#import "EXHeadlessAppRecord.h"

#import <UMAppLoader/UMAppLoaderProvider.h>

@implementation EXHeadlessAppLoader

UM_REGISTER_APP_LOADER(react-native-experience);

- (id<UMAppRecordInterface>)loadAppWithUrl:(NSString *)url options:(NSDictionary *)options callback:(void (^)(BOOL, NSError *))callback
{
  NSURL *manifestUrl = [NSURL URLWithString:url];
  return [[EXHeadlessAppRecord alloc] initWithManifestUrl:manifestUrl callback:callback];
}

@end
