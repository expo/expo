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

@interface ZXByteMatrix : NSObject

@property (nonatomic, assign, readonly) int8_t **array;
@property (nonatomic, assign, readonly) int height;
@property (nonatomic, assign, readonly) int width;

- (id)initWithWidth:(int)width height:(int)height;
- (int8_t)getX:(int)x y:(int)y;
- (void)setX:(int)x y:(int)y byteValue:(int8_t)value;
- (void)setX:(int)x y:(int)y intValue:(int32_t)value;
- (void)setX:(int)x y:(int)y boolValue:(BOOL)value;
- (void)clear:(int8_t)value;

@end
