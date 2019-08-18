/* Copyright (c) 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "GMUPlacemark.h"

@implementation GMUPlacemark

@synthesize geometry = _geometry;

@synthesize style = _style;

- (instancetype)initWithGeometry:(id<GMUGeometry>)geometry
                           title:(NSString *)title
                         snippet:(NSString *)snippet
                           style:(GMUStyle *)style
                        styleUrl:(NSString *)styleUrl {
  if (self = [super init]) {
    _geometry = geometry;
    _title = [title copy];
    _snippet = [snippet copy];
    _style = style;
    _styleUrl = [styleUrl copy];
  }
  return self;
}

@end
