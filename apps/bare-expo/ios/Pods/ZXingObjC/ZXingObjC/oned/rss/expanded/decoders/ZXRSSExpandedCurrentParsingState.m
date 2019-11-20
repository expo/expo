/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "ZXRSSExpandedCurrentParsingState.h"

enum {
  ZX_NUMERIC_STATE,
  ZX_ALPHA_STATE,
  ZX_ISO_IEC_646_STATE
};

@interface ZXRSSExpandedCurrentParsingState ()

@property (nonatomic, assign) int encoding;

@end

@implementation ZXRSSExpandedCurrentParsingState

- (id)init {
  if (self = [super init]) {
    _position = 0;
    _encoding = ZX_NUMERIC_STATE;
  }
  return self;
}

- (BOOL)alpha {
  return self.encoding == ZX_ALPHA_STATE;
}

- (BOOL)numeric {
  return self.encoding == ZX_NUMERIC_STATE;
}

- (BOOL)isoIec646 {
  return self.encoding == ZX_ISO_IEC_646_STATE;
}

- (void)setNumeric {
  self.encoding = ZX_NUMERIC_STATE;
}

- (void)setAlpha {
  self.encoding = ZX_ALPHA_STATE;
}

- (void)setIsoIec646 {
  self.encoding = ZX_ISO_IEC_646_STATE;
}

@end
