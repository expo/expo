/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTLocalizationProvider.h"

#import <Foundation/Foundation.h>

static id<ABI43_0_0RCTLocalizationProtocol> _delegate = nil;
static NSDictionary<NSString *, NSString *> *_languagePack = nil;

void setLocalizationDelegate(id<ABI43_0_0RCTLocalizationProtocol> delegate)
{
  _delegate = delegate;
}

void setLocalizationLanguagePack(NSDictionary<NSString *, NSString *> *pack)
{
  _languagePack = pack;
}

@implementation ABI43_0_0RCTLocalizationProvider

+ (NSString *)ABI43_0_0RCTLocalizedString:(NSString *)oldString withDescription:(NSString *)description
{
  if (_delegate != nil) {
    return [_delegate localizedString:oldString withDescription:description];
  }

  if (_languagePack != nil) {
    return _languagePack[oldString];
  }

  return oldString;
}

@end
