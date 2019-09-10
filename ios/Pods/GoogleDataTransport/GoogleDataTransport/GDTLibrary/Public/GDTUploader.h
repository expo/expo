/*
 * Copyright 2018 Google
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

#import <GoogleDataTransport/GDTClock.h>
#import <GoogleDataTransport/GDTLifecycle.h>
#import <GoogleDataTransport/GDTPrioritizer.h>
#import <GoogleDataTransport/GDTTargets.h>
#import <GoogleDataTransport/GDTUploadPackage.h>

NS_ASSUME_NONNULL_BEGIN

/** This protocol defines the common interface for uploader implementations. */
@protocol GDTUploader <NSObject, GDTLifecycleProtocol, GDTUploadPackageProtocol>

@required

/** Returns YES if the uploader can make an upload attempt, NO otherwise.
 *
 * @param conditions The conditions that the upload attempt is likely to occur under.
 * @return YES if the uploader can make an upload attempt, NO otherwise.
 */
- (BOOL)readyToUploadWithConditions:(GDTUploadConditions)conditions;

/** Uploads events to the backend using this specific backend's chosen format.
 *
 * @param package The event package to upload. Make sure to call -completeDelivery.
 */
- (void)uploadPackage:(GDTUploadPackage *)package;

@end

NS_ASSUME_NONNULL_END
