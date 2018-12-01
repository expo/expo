// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXErrors/EXErrors.h>

void EXRejectInvalidArgument(EXPromiseRejectBlock rejecter, NSString *message)
{
  rejecter(@"ERR_INVALID_ARGUMENT", message, nil);
}
