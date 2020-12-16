/*
 * Copyright 2019 Google
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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** This class represents a future data object, determined at instantiation time. */
@interface GDTCORDataFuture : NSObject <NSSecureCoding>

/** If not nil, this data future was instantiated with this file URL. */
@property(nullable, readonly, nonatomic) NSURL *fileURL;

/** Initializes an instance with the given the fileURL.
 *
 * @param fileURL The fileURL containing the data to return in -data.
 * @return An instance of this class.
 */
- (instancetype)initWithFileURL:(NSURL *)fileURL;

@end

NS_ASSUME_NONNULL_END
