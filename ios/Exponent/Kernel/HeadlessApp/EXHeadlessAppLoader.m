// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXHeadlessAppLoader.h"
#import "EXHeadlessAppRecord.h"

#import <EXAppLoaderProvider/EXAppLoaderProvider.h>

@implementation EXHeadlessAppLoader

EX_REGISTER_APP_LOADER(react-native-experience);

- (id<EXAppRecordInterface>)loadAppWithUrl:(NSString *)url options:(NSDictionary *)options callback:(void (^)(BOOL, NSError *))callback
{
  NSURL *manifestUrl = [NSURL URLWithString:url];
  NSNumber *timeout = [options objectForKey:@"timeout"];
  NSDictionary *initialProps = [options objectForKey:@"initialProps"];

  id<EXAppRecordInterface> appRecord = [[EXHeadlessAppRecord alloc] initWithManifestUrl:manifestUrl
                                                                           initialProps:initialProps
                                                                           fetchTimeout:timeout
                                                                               callback:callback];

  return appRecord;
}

@end
