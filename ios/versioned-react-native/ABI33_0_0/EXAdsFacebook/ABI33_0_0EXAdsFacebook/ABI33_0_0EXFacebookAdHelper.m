// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI33_0_0EXFacebookAdHelper.h"

@implementation ABI33_0_0EXFacebookAdHelper

+ (id)facebookAppIdFromNSBundle
{
  return [[NSBundle mainBundle].infoDictionary objectForKey:@"FacebookAppID"];
}

@end
