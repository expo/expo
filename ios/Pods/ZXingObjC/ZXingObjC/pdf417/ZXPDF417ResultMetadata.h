/*
 * Copyright 2013 ZXing authors
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

@interface ZXPDF417ResultMetadata : NSObject

@property (nonatomic, assign) int segmentIndex;
@property (nonatomic, copy) NSString *fileId;
@property (nonatomic, assign) BOOL lastSegment;
@property (nonatomic, assign) int segmentCount;
@property (nonatomic, copy) NSString *sender;
@property (nonatomic, copy) NSString *addressee;
@property (nonatomic, copy) NSString *fileName;
@property (nonatomic, assign) long long fileSize;
@property (nonatomic, assign) long long timestamp;
@property (nonatomic, assign) int checksum;
@property (nonatomic, strong) NSArray *optionalData;

@end
