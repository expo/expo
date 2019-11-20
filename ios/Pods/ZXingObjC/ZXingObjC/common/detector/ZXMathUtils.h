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

@interface ZXMathUtils : NSObject

/**
 * Ends up being a bit faster than round(). This merely rounds its
 * argument to the nearest int, where x.5 rounds up to x+1.
 *
 * @param d real value to round
 * @return nearest int
 */
+ (int)round:(float)d;

+ (float)distance:(float)aX aY:(float)aY bX:(float)bX bY:(float)bY;

+ (float)distanceInt:(int)aX aY:(int)aY bX:(int)bX bY:(int)bY;

@end
