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

#import "GMUStyle.h"

@implementation GMUStyle

- (instancetype)initWithStyleID:(NSString *)styleID
                    strokeColor:(UIColor *)strokeColor
                      fillColor:(UIColor *)fillColor
                          width:(CGFloat)width
                          scale:(CGFloat)scale
                        heading:(CGFloat)heading
                         anchor:(CGPoint)anchor
                        iconUrl:(NSString *)iconUrl
                          title:(NSString *)title
                        hasFill:(BOOL)hasFill
                      hasStroke:(BOOL)hasStroke {
  if (self = [super init]) {
    _styleID = [styleID copy];
    _strokeColor = strokeColor;
    _fillColor = fillColor;
    _width = width;
    _scale = scale;
    _heading = heading;
    _anchor = anchor;
    _iconUrl = [iconUrl copy];
    _title = [title copy];
    _hasFill = hasFill;
    _hasStroke = hasStroke;
  }
  return self;
}

@end
