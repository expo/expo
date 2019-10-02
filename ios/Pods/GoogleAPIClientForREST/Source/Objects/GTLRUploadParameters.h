/* Copyright (c) 2011 Google Inc.
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

// Uploading documentation:
// https://github.com/google/google-api-objectivec-client-for-rest/wiki#uploading-files

#import <Foundation/Foundation.h>

#import "GTLRDefines.h"

NS_ASSUME_NONNULL_BEGIN

/**
 *  Upload parameters are required for chunked-resumable or simple/multipart uploads.
 *
 *  The MIME type and one source for data (@c NSData, file URL, or @c NSFileHandle) must
 *  be specified.
 */
@interface GTLRUploadParameters : NSObject <NSCopying>

/**
 *  The type of media being uploaded.
 */
@property(atomic, copy, nullable) NSString *MIMEType;

/**
 *  The media to be uploaded, represented as @c NSData.
 */
@property(atomic, retain, nullable) NSData *data;

/**
 *  The URL for the local file to be uploaded.
 */
@property(atomic, retain, nullable) NSURL *fileURL;

/**
 *  The media to be uploaded, represented as @c NSFileHandle.
 *
 *  @note This property is provided for compatibility with older code.
 *        Uploading using @c fileURL is preferred over @c fileHandle
 */
@property(atomic, retain, nullable) NSFileHandle *fileHandle;

/**
 *  Resuming an in-progress resumable, chunked upload is done with the upload location URL,
 *  and requires a file URL or file handle for uploading.
 */
@property(atomic, retain, nullable) NSURL *uploadLocationURL;

/**
 *  Small uploads (for example, under 200K) can be done with a single multipart upload
 *  request. The upload body must be provided as NSData, not a file URL or file handle.
 *
 *  Default value is NO.
 */
@property(atomic, assign) BOOL shouldUploadWithSingleRequest;

/**
 *  Uploads may be done without a JSON body as metadata in the initial request.
 *
 *  Default value is NO.
 */
@property(atomic, assign) BOOL shouldSendUploadOnly;

/**
 *  Uploads may use a background session when uploading via GTMSessionUploadFetcher.
 *  Since background session fetches are slower than foreground fetches, this defaults
 *  to NO.
 *
 *  It's reasonable for an application to set this to YES for a rare upload of a large file.
 *
 *  Default value is NO.
 *
 *  For more information about the hazards of background sessions, see the header comments for
 *  the GTMSessionFetcher useBackgroundSession property.
 */
@property(atomic, assign) BOOL useBackgroundSession;

/**
 *  Constructor for uploading from @c NSData.
 *
 *  @param data     The data to uploaded.
 *  @param mimeType The media's type.
 *
 *  @return The upload parameters object.
 */
+ (instancetype)uploadParametersWithData:(NSData *)data
                                MIMEType:(NSString *)mimeType;

/**
 *  Constructor for uploading from a file URL.
 *
 *  @param fileURL  The file to upload.
 *  @param mimeType The media's type.
 *
 *  @return The upload parameters object.
 */
+ (instancetype)uploadParametersWithFileURL:(NSURL *)fileURL
                                   MIMEType:(NSString *)mimeType;

/**
 *  Constructor for uploading from a file handle.
 *
 *  @note This method is provided for compatibility with older code.  To upload files,
 *        use a file URL.
 */
+ (instancetype)uploadParametersWithFileHandle:(NSFileHandle *)fileHandle
                                      MIMEType:(NSString *)mimeType;

@end

NS_ASSUME_NONNULL_END
