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

#import <GoogleDataTransport/GDTCORUploadPackage.h>

@class GDTCORStorage;

@interface GDTCORUploadPackage ()

/** The storage object this upload package will use to resolve event hashes to files. */
@property(nonatomic) GDTCORStorage *storage;

/** A handler that will receive callbacks for certain events. */
@property(nonatomic) id<NSSecureCoding, GDTCORUploadPackageProtocol> handler;

@end
