/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTLocalizationProvider.h"

#import <Foundation/Foundation.h>

static id<ABI47_0_0RCTLocalizationProtocol> _delegate = nil;
static NSDictionary<NSString *, NSString *> *_languagePack = nil;

void setLocalizationDelegate(id<ABI47_0_0RCTLocalizationProtocol> delegate)
{
  _delegate = delegate;
}

void setLocalizationLanguagePack(NSDictionary<NSString *, NSString *> *pack)
{
  _languagePack = pack;
}

@implementation ABI47_0_0RCTLocalizationProvider

+ (NSString *)ABI47_0_0RCTLocalizedString:(NSString *)oldString withDescription:(NSString *)description
{
  NSString *candidate = nil;

  if (_delegate != nil) {
    candidate = [_delegate localizedString:oldString withDescription:description];
  }

  if (candidate == nil && _languagePack != nil) {
    candidate = _languagePack[oldString];
  }

  if (candidate == nil) {
    candidate = oldString;
  }

  return candidate;
}

@end
