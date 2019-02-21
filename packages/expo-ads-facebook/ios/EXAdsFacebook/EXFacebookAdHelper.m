// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXFacebookAdHelper.h"

@implementation EXFacebookAdHelper

+ (id)facebookAppIdFromNSBundle
{
  return [[NSBundle mainBundle].infoDictionary objectForKey:@"FacebookAppID"];
}

@end
