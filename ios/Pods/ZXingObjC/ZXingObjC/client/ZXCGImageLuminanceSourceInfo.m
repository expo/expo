/*
 * Copyright 2018 ZXing contributors
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

#import "ZXCGImageLuminanceSourceInfo.h"

@implementation ZXCGImageLuminanceSourceInfo

- (instancetype)initWithNormal {
  self = [super init];
  if (self) {
    _type = ZXCGImageLuminanceSourceNormal;
  }
  return self;
}

- (instancetype)initWithLuma {
  self = [super init];
  if (self) {
    _type = ZXCGImageLuminanceSourceLuma;
  }
  return self;
}

- (instancetype)initWithShades:(uint32_t)numberOfShades {
  self = [super init];
  if (self) {
    _type = ZXCGImageLuminanceSourceShades;
    _numberOfShades = numberOfShades;
  }
  return self;
}

- (instancetype)initWithDigital {
  self = [super init];
  if (self) {
    _type = ZXCGImageLuminanceSourceDigital;
  }
  return self;
}

- (instancetype)initWithDecomposingMax {
  self = [super init];
  if (self) {
    _type = ZXCGImageLuminanceSourceDecomposingMax;
  }
  return self;
}

- (instancetype)initWithDecomposingMin {
  self = [super init];
  if (self) {
    _type = ZXCGImageLuminanceSourceDecomposingMin;
  }
  return self;
}

@end
