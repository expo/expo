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

#import <GoogleDataTransport/GDTTargets.h>

@class GDTClock;
@class GDTStoredEvent;
@class GDTUploadPackage;

/** A protocol that allows a handler to respond to package lifecycle events. */
@protocol GDTUploadPackageProtocol <NSObject>

@optional

/** Indicates that the package has expired.
 *
 * @note Package expiration will only be checked every 5 seconds.
 *
 * @param package The package that has expired.
 */
- (void)packageExpired:(GDTUploadPackage *)package;

/** Indicates that the package was successfully delivered.
 *
 * @param package The package that was delivered.
 */
- (void)packageDelivered:(GDTUploadPackage *)package successful:(BOOL)successful;

@end

/** This class is a container that's handed off to uploaders. */
@interface GDTUploadPackage : NSObject <NSSecureCoding>

/** The set of stored events in this upload package. */
@property(nonatomic) NSSet<GDTStoredEvent *> *events;

/** The expiration time. If [[GDTClock snapshot] isAfter:deliverByTime] this package has expired.
 *
 * @note By default, the expiration time will be 3 minutes from creation.
 */
@property(nonatomic) GDTClock *deliverByTime;

/** The target of this package. */
@property(nonatomic, readonly) GDTTarget target;

/** Initializes a package instance.
 *
 * @param target The target/destination of this package.
 * @return An instance of this class.
 */
- (instancetype)initWithTarget:(GDTTarget)target NS_DESIGNATED_INITIALIZER;

// Please use the designated initializer.
- (instancetype)init NS_UNAVAILABLE;

/** Completes delivery of the package.
 *
 * @note This *needs* to be called by an uploader for the package to not expire.
 */
- (void)completeDelivery;

/** Sends the package back, indicating that delivery should be attempted again in the future. */
- (void)retryDeliveryInTheFuture;

@end
