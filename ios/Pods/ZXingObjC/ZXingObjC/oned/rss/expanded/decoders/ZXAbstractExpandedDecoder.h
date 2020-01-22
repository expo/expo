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

@class ZXBitArray, ZXRSSExpandedGeneralAppIdDecoder;

@interface ZXAbstractExpandedDecoder : NSObject

@property (nonatomic, strong, readonly) ZXRSSExpandedGeneralAppIdDecoder *generalDecoder;
@property (nonatomic, strong, readonly) ZXBitArray *information;

- (id)initWithInformation:(ZXBitArray *)information;
- (NSString *)parseInformationWithError:(NSError **)error;
+ (ZXAbstractExpandedDecoder *)createDecoder:(ZXBitArray *)information;

@end
