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

#import <GoogleDataTransport/GDTCORUploader.h>

NS_ASSUME_NONNULL_BEGIN

/** Class capable of uploading events to the CCT backend. */
@interface GDTCCTUploader : NSObject <GDTCORUploader>

/** The queue on which all CCT uploading will occur. */
@property(nonatomic, readonly) dispatch_queue_t uploaderQueue;

/** The server URL to upload to. Look at .m for the default value. */
@property(nonatomic) NSURL *serverURL;

/** The URL session that will attempt upload. */
@property(nonatomic, readonly) NSURLSession *uploaderSession;

/** The current upload task. */
@property(nullable, nonatomic, readonly) NSURLSessionUploadTask *currentTask;

/** Current upload package. */
@property(nullable, nonatomic) GDTCORUploadPackage *currentUploadPackage;

/** The next upload time. */
@property(nullable, nonatomic) GDTCORClock *nextUploadTime;

/** Creates and/or returns the singleton instance of this class.
 *
 * @return The singleton instance of this class.
 */
+ (instancetype)sharedInstance;

@end

NS_ASSUME_NONNULL_END
