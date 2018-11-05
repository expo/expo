/* Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#include <sys/stat.h>
#include <unistd.h>

#import "GTMSessionFetcherLogging.h"

#ifndef STRIP_GTM_FETCH_LOGGING
  #error GTMSessionFetcher headers should have defaulted this if it wasn't already defined.
#endif

#if !STRIP_GTM_FETCH_LOGGING

// Sensitive credential strings are replaced in logs with _snip_
//
// Apps that must see the contents of sensitive tokens can set this to 1
#ifndef SKIP_GTM_FETCH_LOGGING_SNIPPING
#define SKIP_GTM_FETCH_LOGGING_SNIPPING 0
#endif

// If GTMReadMonitorInputStream is available, it can be used for
// capturing uploaded streams of data
//
// We locally declare methods of GTMReadMonitorInputStream so we
// do not need to import the header, as some projects may not have it available
#if !GTMSESSION_BUILD_COMBINED_SOURCES
@interface GTMReadMonitorInputStream : NSInputStream

+ (instancetype)inputStreamWithStream:(NSInputStream *)input;

@property (assign) id readDelegate;
@property (assign) SEL readSelector;

@end
#else
@class GTMReadMonitorInputStream;
#endif  // !GTMSESSION_BUILD_COMBINED_SOURCES

@interface GTMSessionFetcher (GTMHTTPFetcherLoggingUtilities)

+ (NSString *)headersStringForDictionary:(NSDictionary *)dict;
+ (NSString *)snipSubstringOfString:(NSString *)originalStr
                 betweenStartString:(NSString *)startStr
                          endString:(NSString *)endStr;
- (void)inputStream:(GTMReadMonitorInputStream *)stream
     readIntoBuffer:(void *)buffer
             length:(int64_t)length;

@end

@implementation GTMSessionFetcher (GTMSessionFetcherLogging)

// fetchers come and fetchers go, but statics are forever
static BOOL gIsLoggingEnabled = NO;
static BOOL gIsLoggingToFile = YES;
static NSString *gLoggingDirectoryPath = nil;
static NSString *gLogDirectoryForCurrentRun = nil;
static NSString *gLoggingDateStamp = nil;
static NSString *gLoggingProcessName = nil;

+ (void)setLoggingDirectory:(NSString *)path {
  gLoggingDirectoryPath = [path copy];
}

+ (NSString *)loggingDirectory {
  if (!gLoggingDirectoryPath) {
    NSArray *paths = nil;
#if TARGET_IPHONE_SIMULATOR
    // default to a directory called GTMHTTPDebugLogs into a sandbox-safe
    // directory that a developer can find easily, the application home
    paths = @[ NSHomeDirectory() ];
#elif TARGET_OS_IPHONE
    // Neither ~/Desktop nor ~/Home is writable on an actual iOS, watchOS, or tvOS device.
    // Put it in ~/Documents.
    paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
#else
    // default to a directory called GTMHTTPDebugLogs in the desktop folder
    paths = NSSearchPathForDirectoriesInDomains(NSDesktopDirectory, NSUserDomainMask, YES);
#endif

    NSString *desktopPath = paths.firstObject;
    if (desktopPath) {
      NSString *const kGTMLogFolderName = @"GTMHTTPDebugLogs";
      NSString *logsFolderPath = [desktopPath stringByAppendingPathComponent:kGTMLogFolderName];

      NSFileManager *fileMgr = [NSFileManager defaultManager];
      BOOL isDir;
      BOOL doesFolderExist = [fileMgr fileExistsAtPath:logsFolderPath isDirectory:&isDir];
      if (!doesFolderExist) {
        // make the directory
        doesFolderExist = [fileMgr createDirectoryAtPath:logsFolderPath
                             withIntermediateDirectories:YES
                                              attributes:nil
                                                   error:NULL];
        if (doesFolderExist) {
          // The directory has been created. Exclude it from backups.
          NSURL *pathURL = [NSURL fileURLWithPath:logsFolderPath isDirectory:YES];
          [pathURL setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:NULL];
        }
      }

      if (doesFolderExist) {
        // it's there; store it in the global
        gLoggingDirectoryPath = [logsFolderPath copy];
      }
    }
  }
  return gLoggingDirectoryPath;
}

+ (void)setLogDirectoryForCurrentRun:(NSString *)logDirectoryForCurrentRun {
  // Set the path for this run's logs.
  gLogDirectoryForCurrentRun = [logDirectoryForCurrentRun copy];
}

+ (NSString *)logDirectoryForCurrentRun {
  // make a directory for this run's logs, like SyncProto_logs_10-16_01-56-58PM
  if (gLogDirectoryForCurrentRun) return gLogDirectoryForCurrentRun;

  NSString *parentDir = [self loggingDirectory];
  NSString *logNamePrefix = [self processNameLogPrefix];
  NSString *dateStamp = [self loggingDateStamp];
  NSString *dirName = [NSString stringWithFormat:@"%@%@", logNamePrefix, dateStamp];
  NSString *logDirectory = [parentDir stringByAppendingPathComponent:dirName];

  if (gIsLoggingToFile) {
    NSFileManager *fileMgr = [NSFileManager defaultManager];
    // Be sure that the first time this app runs, it's not writing to a preexisting folder
    static BOOL gShouldReuseFolder = NO;
    if (!gShouldReuseFolder) {
      gShouldReuseFolder = YES;
      NSString *origLogDir = logDirectory;
      for (int ctr = 2; ctr < 20; ++ctr) {
        if (![fileMgr fileExistsAtPath:logDirectory]) break;

        // append a digit
        logDirectory = [origLogDir stringByAppendingFormat:@"_%d", ctr];
      }
    }
    if (![fileMgr createDirectoryAtPath:logDirectory
            withIntermediateDirectories:YES
                             attributes:nil
                                  error:NULL]) return nil;
  }
  gLogDirectoryForCurrentRun = logDirectory;

  return gLogDirectoryForCurrentRun;
}

+ (void)setLoggingEnabled:(BOOL)isLoggingEnabled {
  gIsLoggingEnabled = isLoggingEnabled;
}

+ (BOOL)isLoggingEnabled {
  return gIsLoggingEnabled;
}

+ (void)setLoggingToFileEnabled:(BOOL)isLoggingToFileEnabled {
  gIsLoggingToFile = isLoggingToFileEnabled;
}

+ (BOOL)isLoggingToFileEnabled {
  return gIsLoggingToFile;
}

+ (void)setLoggingProcessName:(NSString *)processName {
  gLoggingProcessName = [processName copy];
}

+ (NSString *)loggingProcessName {
  // get the process name (once per run) replacing spaces with underscores
  if (!gLoggingProcessName) {
    NSString *procName = [[NSProcessInfo processInfo] processName];
    gLoggingProcessName = [procName stringByReplacingOccurrencesOfString:@" " withString:@"_"];
  }
  return gLoggingProcessName;
}

+ (void)setLoggingDateStamp:(NSString *)dateStamp {
  gLoggingDateStamp = [dateStamp copy];
}

+ (NSString *)loggingDateStamp {
  // We'll pick one date stamp per run, so a run that starts at a later second
  // will get a unique results html file
  if (!gLoggingDateStamp) {
    // produce a string like 08-21_01-41-23PM

    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setFormatterBehavior:NSDateFormatterBehavior10_4];
    [formatter setDateFormat:@"M-dd_hh-mm-ssa"];

    gLoggingDateStamp = [formatter stringFromDate:[NSDate date]];
  }
  return gLoggingDateStamp;
}

+ (NSString *)processNameLogPrefix {
  static NSString *gPrefix = nil;
  if (!gPrefix) {
    NSString *processName = [self loggingProcessName];
    gPrefix = [[NSString alloc] initWithFormat:@"%@_log_", processName];
  }
  return gPrefix;
}

+ (NSString *)symlinkNameSuffix {
  return @"_log_newest.html";
}

+ (NSString *)htmlFileName {
  return @"aperçu_http_log.html";
}

+ (void)deleteLogDirectoriesOlderThanDate:(NSDate *)cutoffDate {
  NSFileManager *fileMgr = [NSFileManager defaultManager];
  NSURL *parentDir = [NSURL fileURLWithPath:[[self class] loggingDirectory]];
  NSURL *logDirectoryForCurrentRun =
      [NSURL fileURLWithPath:[[self class] logDirectoryForCurrentRun]];
  NSError *error;
  NSArray *contents = [fileMgr contentsOfDirectoryAtURL:parentDir
                             includingPropertiesForKeys:@[ NSURLContentModificationDateKey ]
                                                options:0
                                                  error:&error];
  for (NSURL *itemURL in contents) {
    if ([itemURL isEqual:logDirectoryForCurrentRun]) continue;

    NSDate *modDate;
    if ([itemURL getResourceValue:&modDate
                           forKey:NSURLContentModificationDateKey
                            error:&error]) {
      if ([modDate compare:cutoffDate] == NSOrderedAscending) {
        if (![fileMgr removeItemAtURL:itemURL error:&error]) {
          NSLog(@"deleteLogDirectoriesOlderThanDate failed to delete %@: %@",
                itemURL.path, error);
        }
      }
    } else {
      NSLog(@"deleteLogDirectoriesOlderThanDate failed to get mod date of %@: %@",
            itemURL.path, error);
    }
  }
}

// formattedStringFromData returns a prettyprinted string for XML or JSON input,
// and a plain string for other input data
- (NSString *)formattedStringFromData:(NSData *)inputData
                          contentType:(NSString *)contentType
                                 JSON:(NSDictionary **)outJSON {
  if (!inputData) return nil;

  // if the content type is JSON and we have the parsing class available, use that
  if ([contentType hasPrefix:@"application/json"] && inputData.length > 5) {
    // convert from JSON string to NSObjects and back to a formatted string
    NSMutableDictionary *obj = [NSJSONSerialization JSONObjectWithData:inputData
                                                               options:NSJSONReadingMutableContainers
                                                                 error:NULL];
    if (obj) {
      if (outJSON) *outJSON = obj;
      if ([obj isKindOfClass:[NSMutableDictionary class]]) {
        // for security and privacy, omit OAuth 2 response access and refresh tokens
        if ([obj valueForKey:@"refresh_token"] != nil) {
          [obj setObject:@"_snip_" forKey:@"refresh_token"];
        }
        if ([obj valueForKey:@"access_token"] != nil) {
          [obj setObject:@"_snip_" forKey:@"access_token"];
        }
      }
      NSData *data = [NSJSONSerialization dataWithJSONObject:obj
                                                     options:NSJSONWritingPrettyPrinted
                                                       error:NULL];
      if (data) {
        NSString *jsonStr = [[NSString alloc] initWithData:data
                                                  encoding:NSUTF8StringEncoding];
        return jsonStr;
      }
    }
  }

#if !TARGET_OS_IPHONE && !GTM_SKIP_LOG_XMLFORMAT
  // verify that this data starts with the bytes indicating XML

  NSString *const kXMLLintPath = @"/usr/bin/xmllint";
  static BOOL gHasCheckedAvailability = NO;
  static BOOL gIsXMLLintAvailable = NO;

  if (!gHasCheckedAvailability) {
    gIsXMLLintAvailable = [[NSFileManager defaultManager] fileExistsAtPath:kXMLLintPath];
    gHasCheckedAvailability = YES;
  }
  if (gIsXMLLintAvailable
      && inputData.length > 5
      && strncmp(inputData.bytes, "<?xml", 5) == 0) {

    // call xmllint to format the data
    NSTask *task = [[NSTask alloc] init];
    [task setLaunchPath:kXMLLintPath];

    // use the dash argument to specify stdin as the source file
    [task setArguments:@[ @"--format", @"-" ]];
    [task setEnvironment:@{}];

    NSPipe *inputPipe = [NSPipe pipe];
    NSPipe *outputPipe = [NSPipe pipe];
    [task setStandardInput:inputPipe];
    [task setStandardOutput:outputPipe];

    [task launch];

    [[inputPipe fileHandleForWriting] writeData:inputData];
    [[inputPipe fileHandleForWriting] closeFile];

    // drain the stdout before waiting for the task to exit
    NSData *formattedData = [[outputPipe fileHandleForReading] readDataToEndOfFile];

    [task waitUntilExit];

    int status = [task terminationStatus];
    if (status == 0 && formattedData.length > 0) {
      // success
      inputData = formattedData;
    }
  }
#else
  // we can't call external tasks on the iPhone; leave the XML unformatted
#endif

  NSString *dataStr = [[NSString alloc] initWithData:inputData
                                            encoding:NSUTF8StringEncoding];
  return dataStr;
}

// stringFromStreamData creates a string given the supplied data
//
// If NSString can create a UTF-8 string from the data, then that is returned.
//
// Otherwise, this routine tries to find a MIME boundary at the beginning of the data block, and
// uses that to break up the data into parts. Each part will be used to try to make a UTF-8 string.
// For parts that fail, a replacement string showing the part header and <<n bytes>> is supplied
// in place of the binary data.

- (NSString *)stringFromStreamData:(NSData *)data
                       contentType:(NSString *)contentType {

  if (!data) return nil;

  // optimistically, see if the whole data block is UTF-8
  NSString *streamDataStr = [self formattedStringFromData:data
                                              contentType:contentType
                                                     JSON:NULL];
  if (streamDataStr) return streamDataStr;

  // Munge a buffer by replacing non-ASCII bytes with underscores, and turn that munged buffer an
  // NSString.  That gives us a string we can use with NSScanner.
  NSMutableData *mutableData = [NSMutableData dataWithData:data];
  unsigned char *bytes = (unsigned char *)mutableData.mutableBytes;

  for (unsigned int idx = 0; idx < mutableData.length; ++idx) {
    if (bytes[idx] > 0x7F || bytes[idx] == 0) {
      bytes[idx] = '_';
    }
  }

  NSString *mungedStr = [[NSString alloc] initWithData:mutableData
                                              encoding:NSUTF8StringEncoding];
  if (mungedStr) {

    // scan for the boundary string
    NSString *boundary = nil;
    NSScanner *scanner = [NSScanner scannerWithString:mungedStr];

    if ([scanner scanUpToString:@"\r\n" intoString:&boundary]
        && [boundary hasPrefix:@"--"]) {

      // we found a boundary string; use it to divide the string into parts
      NSArray *mungedParts = [mungedStr componentsSeparatedByString:boundary];

      // look at each munged part in the original string, and try to convert those into UTF-8
      NSMutableArray *origParts = [NSMutableArray array];
      NSUInteger offset = 0;
      for (NSString *mungedPart in mungedParts) {
        NSUInteger partSize = mungedPart.length;
        NSData *origPartData = [data subdataWithRange:NSMakeRange(offset, partSize)];
        NSString *origPartStr = [[NSString alloc] initWithData:origPartData
                                                      encoding:NSUTF8StringEncoding];
        if (origPartStr) {
          // we could make this original part into UTF-8; use the string
          [origParts addObject:origPartStr];
        } else {
          // this part can't be made into UTF-8; scan the header, if we can
          NSString *header = nil;
          NSScanner *headerScanner = [NSScanner scannerWithString:mungedPart];
          if (![headerScanner scanUpToString:@"\r\n\r\n" intoString:&header]) {
            // we couldn't find a header
            header = @"";
          }
          // make a part string with the header and <<n bytes>>
          NSString *binStr = [NSString stringWithFormat:@"\r%@\r<<%lu bytes>>\r",
                              header, (long)(partSize - header.length)];
          [origParts addObject:binStr];
        }
        offset += partSize + boundary.length;
      }
      // rejoin the original parts
      streamDataStr = [origParts componentsJoinedByString:boundary];
    }
  }
  if (!streamDataStr) {
    // give up; just make a string showing the uploaded bytes
    streamDataStr = [NSString stringWithFormat:@"<<%u bytes>>", (unsigned int)data.length];
  }
  return streamDataStr;
}

// logFetchWithError is called following a successful or failed fetch attempt
//
// This method does all the work for appending to and creating log files

- (void)logFetchWithError:(NSError *)error {
  if (![[self class] isLoggingEnabled]) return;
  NSString *logDirectory = [[self class] logDirectoryForCurrentRun];
  if (!logDirectory) return;
  NSString *processName = [[self class] loggingProcessName];

  // TODO: add Javascript to display response data formatted in hex

  // each response's NSData goes into its own xml or txt file, though all responses for this run of
  // the app share a main html file. This counter tracks all fetch responses for this app run.
  //
  // we'll use a local variable since this routine may be reentered while waiting for XML formatting
  // to be completed by an external task
  static int gResponseCounter = 0;
  int responseCounter = ++gResponseCounter;

  NSURLResponse *response = [self response];
  NSDictionary *responseHeaders = [self responseHeaders];
  NSString *responseDataStr = nil;
  NSDictionary *responseJSON = nil;

  // if there's response data, decide what kind of file to put it in based on the first bytes of the
  // file or on the mime type supplied by the server
  NSString *responseMIMEType = [response MIMEType];
  BOOL isResponseImage = NO;

  // file name for an image data file
  NSString *responseDataFileName = nil;

  int64_t responseDataLength = self.downloadedLength;
  if (responseDataLength > 0) {
    NSData *downloadedData = self.downloadedData;
    if (downloadedData == nil
        && responseDataLength > 0
        && responseDataLength < 20000
        && self.destinationFileURL) {
      // There's a download file that's not too big, so get the data to display from the downloaded
      // file.
      NSURL *destinationURL = self.destinationFileURL;
      downloadedData = [NSData dataWithContentsOfURL:destinationURL];
    }
    NSString *responseType = [responseHeaders valueForKey:@"Content-Type"];
    responseDataStr = [self formattedStringFromData:downloadedData
                                        contentType:responseType
                                               JSON:&responseJSON];
    NSString *responseDataExtn = nil;
    NSData *dataToWrite = nil;
    if (responseDataStr) {
      // we were able to make a UTF-8 string from the response data
      if ([responseMIMEType isEqual:@"application/atom+xml"]
          || [responseMIMEType hasSuffix:@"/xml"]) {
        responseDataExtn = @"xml";
        dataToWrite = [responseDataStr dataUsingEncoding:NSUTF8StringEncoding];
      }
    } else if ([responseMIMEType isEqual:@"image/jpeg"]) {
      responseDataExtn = @"jpg";
      dataToWrite = downloadedData;
      isResponseImage = YES;
    } else if ([responseMIMEType isEqual:@"image/gif"]) {
      responseDataExtn = @"gif";
      dataToWrite = downloadedData;
      isResponseImage = YES;
    } else if ([responseMIMEType isEqual:@"image/png"]) {
      responseDataExtn = @"png";
      dataToWrite = downloadedData;
      isResponseImage = YES;
    } else {
      // add more non-text types here
    }
    // if we have an extension, save the raw data in a file with that extension
    if (responseDataExtn && dataToWrite) {
      // generate a response file base name like
      NSString *responseBaseName = [NSString stringWithFormat:@"fetch_%d_response", responseCounter];
      responseDataFileName = [responseBaseName stringByAppendingPathExtension:responseDataExtn];
      NSString *responseDataFilePath = [logDirectory stringByAppendingPathComponent:responseDataFileName];

      NSError *downloadedError = nil;
      if (gIsLoggingToFile && ![dataToWrite writeToFile:responseDataFilePath
                                                options:0
                                                  error:&downloadedError]) {
        NSLog(@"%@ logging write error:%@ (%@)", [self class], downloadedError, responseDataFileName);
      }
    }
  }
  // we'll have one main html file per run of the app
  NSString *htmlName = [[self class] htmlFileName];
  NSString *htmlPath =[logDirectory stringByAppendingPathComponent:htmlName];

  // if the html file exists (from logging previous fetches) we don't need
  // to re-write the header or the scripts
  NSFileManager *fileMgr = [NSFileManager defaultManager];
  BOOL didFileExist = [fileMgr fileExistsAtPath:htmlPath];

  NSMutableString* outputHTML = [NSMutableString string];

  // we need a header to say we'll have UTF-8 text
  if (!didFileExist) {
    [outputHTML appendFormat:@"<html><head><meta http-equiv=\"content-type\" "
        "content=\"text/html; charset=UTF-8\"><title>%@ HTTP fetch log %@</title>",
        processName, [[self class] loggingDateStamp]];
  }
  // now write the visible html elements
  NSString *copyableFileName = [NSString stringWithFormat:@"fetch_%d.txt", responseCounter];

  NSDate *now = [NSDate date];
  // write the date & time, the comment, and the link to the plain-text (copyable) log
  [outputHTML appendFormat:@"<b>%@ &nbsp;&nbsp;&nbsp;&nbsp; ", now];

  NSString *comment = [self comment];
  if (comment.length > 0) {
    [outputHTML appendFormat:@"%@ &nbsp;&nbsp;&nbsp;&nbsp; ", comment];
  }
  [outputHTML appendFormat:@"</b><a href='%@'><i>request/response log</i></a><br>", copyableFileName];
  NSTimeInterval elapsed = -self.initialBeginFetchDate.timeIntervalSinceNow;
  [outputHTML appendFormat:@"elapsed: %5.3fsec<br>", elapsed];

  // write the request URL
  NSURLRequest *request = self.request;
  NSString *requestMethod = request.HTTPMethod;
  NSURL *requestURL = request.URL;

  // Save the request URL for next time in case this redirects.
  NSString *redirectedFromURLString = [self.redirectedFromURL absoluteString];
  self.redirectedFromURL = [requestURL copy];
  if (redirectedFromURLString) {
    [outputHTML appendFormat:@"<FONT COLOR='#990066'><i>redirected from %@</i></FONT><br>",
                              redirectedFromURLString];
  }
  [outputHTML appendFormat:@"<b>request:</b> %@ <code>%@</code><br>\n", requestMethod, requestURL];

  // write the request headers
  NSDictionary *requestHeaders = request.allHTTPHeaderFields;
  NSUInteger numberOfRequestHeaders = requestHeaders.count;
  if (numberOfRequestHeaders > 0) {
    // Indicate if the request is authorized; warn if the request is authorized but non-SSL
    NSString *auth = [requestHeaders objectForKey:@"Authorization"];
    NSString *headerDetails = @"";
    if (auth) {
      BOOL isInsecure = [[requestURL scheme] isEqual:@"http"];
      if (isInsecure) {
        // 26A0 = ⚠
        headerDetails =
            @"&nbsp;&nbsp;&nbsp;<i>authorized, non-SSL</i><FONT COLOR='#FF00FF'> &#x26A0;</FONT> ";
      } else {
        headerDetails = @"&nbsp;&nbsp;&nbsp;<i>authorized</i>";
      }
    }
    NSString *cookiesHdr = [requestHeaders objectForKey:@"Cookie"];
    if (cookiesHdr) {
      headerDetails = [headerDetails stringByAppendingString:@"&nbsp;&nbsp;&nbsp;<i>cookies</i>"];
    }
    NSString *matchHdr = [requestHeaders objectForKey:@"If-Match"];
    if (matchHdr) {
      headerDetails = [headerDetails stringByAppendingString:@"&nbsp;&nbsp;&nbsp;<i>if-match</i>"];
    }
    matchHdr = [requestHeaders objectForKey:@"If-None-Match"];
    if (matchHdr) {
      headerDetails = [headerDetails stringByAppendingString:@"&nbsp;&nbsp;&nbsp;<i>if-none-match</i>"];
    }
    [outputHTML appendFormat:@"&nbsp;&nbsp; headers: %d  %@<br>",
                              (int)numberOfRequestHeaders, headerDetails];
  } else {
    [outputHTML appendFormat:@"&nbsp;&nbsp; headers: none<br>"];
  }
  // write the request post data
  NSData *bodyData = nil;
  NSData *loggedStreamData = self.loggedStreamData;
  if (loggedStreamData) {
    bodyData = loggedStreamData;
  } else {
    bodyData = self.bodyData;
    if (bodyData == nil) {
      bodyData = self.request.HTTPBody;
    }
  }
  uint64_t bodyDataLength = bodyData.length;

  if (bodyData.length == 0) {
    // If the data is in a body upload file URL, read that in if it's not huge.
    NSURL *bodyFileURL = self.bodyFileURL;
    if (bodyFileURL) {
      NSNumber *fileSizeNum = nil;
      NSError *fileSizeError = nil;
      if ([bodyFileURL getResourceValue:&fileSizeNum
                                 forKey:NSURLFileSizeKey
                                  error:&fileSizeError]) {
        bodyDataLength = [fileSizeNum unsignedLongLongValue];
        if (bodyDataLength > 0 && bodyDataLength < 50000) {
          bodyData = [NSData dataWithContentsOfURL:bodyFileURL
                                           options:NSDataReadingUncached
                                             error:&fileSizeError];
        }
      }
    }
  }
  NSString *bodyDataStr = nil;
  NSString *postType = [requestHeaders valueForKey:@"Content-Type"];

  if (bodyDataLength > 0) {
    [outputHTML appendFormat:@"&nbsp;&nbsp; data: %llu bytes, <code>%@</code><br>\n",
                              bodyDataLength, postType ? postType : @"(no type)"];
    NSString *logRequestBody = self.logRequestBody;
    if (logRequestBody) {
      bodyDataStr = [logRequestBody copy];
      self.logRequestBody = nil;
    } else {
      bodyDataStr = [self stringFromStreamData:bodyData
                                   contentType:postType];
      if (bodyDataStr) {
        // remove OAuth 2 client secret and refresh token
        bodyDataStr = [[self class] snipSubstringOfString:bodyDataStr
                                       betweenStartString:@"client_secret="
                                                endString:@"&"];
        bodyDataStr = [[self class] snipSubstringOfString:bodyDataStr
                                       betweenStartString:@"refresh_token="
                                                endString:@"&"];
        // remove ClientLogin password
        bodyDataStr = [[self class] snipSubstringOfString:bodyDataStr
                                       betweenStartString:@"&Passwd="
                                                endString:@"&"];
      }
    }
  } else {
    // no post data
  }
  // write the response status, MIME type, URL
  NSInteger status = [self statusCode];
  if (response) {
    NSString *statusString = @"";
    if (status != 0) {
      if (status == 200 || status == 201) {
        statusString = [NSString stringWithFormat:@"%ld", (long)status];

        // report any JSON-RPC error
        if ([responseJSON isKindOfClass:[NSDictionary class]]) {
          NSDictionary *jsonError = [responseJSON objectForKey:@"error"];
          if ([jsonError isKindOfClass:[NSDictionary class]]) {
            NSString *jsonCode = [[jsonError valueForKey:@"code"] description];
            NSString *jsonMessage = [jsonError valueForKey:@"message"];
            if (jsonCode || jsonMessage) {
              // 2691 = ⚑
              NSString *const jsonErrFmt =
                  @"&nbsp;&nbsp;&nbsp;<i>JSON error:</i> <FONT COLOR='#FF00FF'>%@ %@ &nbsp;&#x2691;</FONT>";
              statusString = [statusString stringByAppendingFormat:jsonErrFmt,
                              jsonCode ? jsonCode : @"",
                              jsonMessage ? jsonMessage : @""];
            }
          }
        }
      } else {
        // purple for anything other than 200 or 201
        NSString *flag = status >= 400 ? @"&nbsp;&#x2691;" : @""; // 2691 = ⚑
        NSString *explanation = [NSHTTPURLResponse localizedStringForStatusCode:status];
        NSString *const statusFormat = @"<FONT COLOR='#FF00FF'>%ld %@ %@</FONT>";
        statusString = [NSString stringWithFormat:statusFormat, (long)status, explanation, flag];
      }
    }
    // show the response URL only if it's different from the request URL
    NSString *responseURLStr = @"";
    NSURL *responseURL = response.URL;

    if (responseURL && ![responseURL isEqual:request.URL]) {
      NSString *const responseURLFormat =
          @"<FONT COLOR='#FF00FF'>response URL:</FONT> <code>%@</code><br>\n";
      responseURLStr = [NSString stringWithFormat:responseURLFormat, [responseURL absoluteString]];
    }
    [outputHTML appendFormat:@"<b>response:</b>&nbsp;&nbsp;status %@<br>\n%@",
                              statusString, responseURLStr];
    // Write the response headers
    NSUInteger numberOfResponseHeaders = responseHeaders.count;
    if (numberOfResponseHeaders > 0) {
      // Indicate if the server is setting cookies
      NSString *cookiesSet = [responseHeaders valueForKey:@"Set-Cookie"];
      NSString *cookiesStr =
          cookiesSet ? @"&nbsp;&nbsp;<FONT COLOR='#990066'><i>sets cookies</i></FONT>" : @"";
      // Indicate if the server is redirecting
      NSString *location = [responseHeaders valueForKey:@"Location"];
      BOOL isRedirect = status >= 300 && status <= 399 && location != nil;
      NSString *redirectsStr =
          isRedirect ? @"&nbsp;&nbsp;<FONT COLOR='#990066'><i>redirects</i></FONT>" : @"";
      [outputHTML appendFormat:@"&nbsp;&nbsp; headers: %d  %@ %@<br>\n",
                                (int)numberOfResponseHeaders, cookiesStr, redirectsStr];
    } else {
      [outputHTML appendString:@"&nbsp;&nbsp; headers: none<br>\n"];
    }
  }
  // error
  if (error) {
    [outputHTML appendFormat:@"<b>Error:</b> %@ <br>\n", error.description];
  }
  // Write the response data
  if (responseDataFileName) {
    if (isResponseImage) {
      // Make a small inline image that links to the full image file
      [outputHTML appendFormat:@"&nbsp;&nbsp; data: %lld bytes, <code>%@</code><br>",
                                responseDataLength, responseMIMEType];
      NSString *const fmt =
          @"<a href=\"%@\"><img src='%@' alt='image' style='border:solid thin;max-height:32'></a>\n";
      [outputHTML appendFormat:fmt, responseDataFileName, responseDataFileName];
    } else {
      // The response data was XML; link to the xml file
      NSString *const fmt =
          @"&nbsp;&nbsp; data: %lld bytes, <code>%@</code>&nbsp;&nbsp;&nbsp;<i><a href=\"%@\">%@</a></i>\n";
      [outputHTML appendFormat:fmt, responseDataLength, responseMIMEType,
                               responseDataFileName, [responseDataFileName pathExtension]];
    }
  } else {
    // The response data was not an image; just show the length and MIME type
    [outputHTML appendFormat:@"&nbsp;&nbsp; data: %lld bytes, <code>%@</code>\n",
        responseDataLength, responseMIMEType ? responseMIMEType : @"(no response type)"];
  }
  // Make a single string of the request and response, suitable for copying
  // to the clipboard and pasting into a bug report
  NSMutableString *copyable = [NSMutableString string];
  if (comment) {
    [copyable appendFormat:@"%@\n\n", comment];
  }
  [copyable appendFormat:@"%@  elapsed: %5.3fsec\n", now, elapsed];
  if (redirectedFromURLString) {
    [copyable appendFormat:@"Redirected from %@\n", redirectedFromURLString];
  }
  [copyable appendFormat:@"Request: %@ %@\n", requestMethod, requestURL];
  if (requestHeaders.count > 0) {
    [copyable appendFormat:@"Request headers:\n%@\n",
                            [[self class] headersStringForDictionary:requestHeaders]];
  }
  if (bodyDataLength > 0) {
    [copyable appendFormat:@"Request body: (%llu bytes)\n", bodyDataLength];
    if (bodyDataStr) {
      [copyable appendFormat:@"%@\n", bodyDataStr];
    }
    [copyable appendString:@"\n"];
  }
  if (response) {
    [copyable appendFormat:@"Response: status %d\n", (int) status];
    [copyable appendFormat:@"Response headers:\n%@\n",
                            [[self class] headersStringForDictionary:responseHeaders]];
    [copyable appendFormat:@"Response body: (%lld bytes)\n", responseDataLength];
    if (responseDataLength > 0) {
      NSString *logResponseBody = self.logResponseBody;
      if (logResponseBody) {
        // The user has provided the response body text.
        responseDataStr = [logResponseBody copy];
        self.logResponseBody = nil;
      }
      if (responseDataStr != nil) {
        [copyable appendFormat:@"%@\n", responseDataStr];
      } else {
        // Even though it's redundant, we'll put in text to indicate that all the bytes are binary.
        if (self.destinationFileURL) {
          [copyable appendFormat:@"<<%lld bytes>>  to file %@\n",
           responseDataLength, self.destinationFileURL.path];
        } else {
          [copyable appendFormat:@"<<%lld bytes>>\n", responseDataLength];
        }
      }
    }
  }
  if (error) {
    [copyable appendFormat:@"Error: %@\n", error];
  }
  // Save to log property before adding the separator
  self.log = copyable;

  [copyable appendString:@"-----------------------------------------------------------\n"];

  // Write the copyable version to another file (linked to at the top of the html file, above)
  //
  // Ideally, something to just copy this to the clipboard like
  //   <span onCopy='window.event.clipboardData.setData(\"Text\",
  //   \"copyable stuff\");return false;'>Copy here.</span>"
  // would work everywhere, but it only works in Safari as of 8/2010
  if (gIsLoggingToFile) {
    NSString *parentDir = [[self class] loggingDirectory];
    NSString *copyablePath = [logDirectory stringByAppendingPathComponent:copyableFileName];
    NSError *copyableError = nil;
    if (![copyable writeToFile:copyablePath
                    atomically:NO
                      encoding:NSUTF8StringEncoding
                         error:&copyableError]) {
      // Error writing to file
      NSLog(@"%@ logging write error:%@ (%@)", [self class], copyableError, copyablePath);
    }
    [outputHTML appendString:@"<br><hr><p>"];

    // Append the HTML to the main output file
    const char* htmlBytes = outputHTML.UTF8String;
    NSOutputStream *stream = [NSOutputStream outputStreamToFileAtPath:htmlPath
                                                               append:YES];
    [stream open];
    [stream write:(const uint8_t *) htmlBytes maxLength:strlen(htmlBytes)];
    [stream close];

    // Make a symlink to the latest html
    NSString *const symlinkNameSuffix = [[self class] symlinkNameSuffix];
    NSString *symlinkName = [processName stringByAppendingString:symlinkNameSuffix];
    NSString *symlinkPath = [parentDir stringByAppendingPathComponent:symlinkName];

    [fileMgr removeItemAtPath:symlinkPath error:NULL];
    [fileMgr createSymbolicLinkAtPath:symlinkPath
                  withDestinationPath:htmlPath
                                error:NULL];
#if TARGET_OS_IPHONE
    static BOOL gReportedLoggingPath = NO;
    if (!gReportedLoggingPath) {
      gReportedLoggingPath = YES;
      NSLog(@"GTMSessionFetcher logging to \"%@\"", parentDir);
    }
#endif
  }
}

- (NSInputStream *)loggedInputStreamForInputStream:(NSInputStream *)inputStream {
  if (!inputStream) return nil;
  if (![GTMSessionFetcher isLoggingEnabled]) return inputStream;

  [self clearLoggedStreamData];  // Clear any previous data.
  Class monitorClass = NSClassFromString(@"GTMReadMonitorInputStream");
  if (!monitorClass) {
    NSString const *str = @"<<Uploaded stream log unavailable without GTMReadMonitorInputStream>>";
    NSData *stringData = [str dataUsingEncoding:NSUTF8StringEncoding];
    [self appendLoggedStreamData:stringData];
    return inputStream;
  }
  inputStream = [monitorClass inputStreamWithStream:inputStream];

  GTMReadMonitorInputStream *readMonitorInputStream = (GTMReadMonitorInputStream *)inputStream;
  [readMonitorInputStream setReadDelegate:self];
  SEL readSel = @selector(inputStream:readIntoBuffer:length:);
  [readMonitorInputStream setReadSelector:readSel];

  return inputStream;
}

- (GTMSessionFetcherBodyStreamProvider)loggedStreamProviderForStreamProvider:
    (GTMSessionFetcherBodyStreamProvider)streamProvider {
  if (!streamProvider) return nil;
  if (![GTMSessionFetcher isLoggingEnabled]) return streamProvider;

  [self clearLoggedStreamData];  // Clear any previous data.
  Class monitorClass = NSClassFromString(@"GTMReadMonitorInputStream");
  if (!monitorClass) {
    NSString const *str = @"<<Uploaded stream log unavailable without GTMReadMonitorInputStream>>";
    NSData *stringData = [str dataUsingEncoding:NSUTF8StringEncoding];
    [self appendLoggedStreamData:stringData];
    return streamProvider;
  }
  GTMSessionFetcherBodyStreamProvider loggedStreamProvider =
      ^(GTMSessionFetcherBodyStreamProviderResponse response) {
      streamProvider(^(NSInputStream *bodyStream) {
          bodyStream = [self loggedInputStreamForInputStream:bodyStream];
          response(bodyStream);
      });
  };
  return loggedStreamProvider;
}

@end

@implementation GTMSessionFetcher (GTMSessionFetcherLoggingUtilities)

- (void)inputStream:(GTMReadMonitorInputStream *)stream
     readIntoBuffer:(void *)buffer
             length:(int64_t)length {
  // append the captured data
  NSData *data = [NSData dataWithBytesNoCopy:buffer
                                      length:(NSUInteger)length
                                freeWhenDone:NO];
  [self appendLoggedStreamData:data];
}

#pragma mark Fomatting Utilities

+ (NSString *)snipSubstringOfString:(NSString *)originalStr
                 betweenStartString:(NSString *)startStr
                          endString:(NSString *)endStr {
#if SKIP_GTM_FETCH_LOGGING_SNIPPING
  return originalStr;
#else
  if (!originalStr) return nil;

  // Find the start string, and replace everything between it
  // and the end string (or the end of the original string) with "_snip_"
  NSRange startRange = [originalStr rangeOfString:startStr];
  if (startRange.location == NSNotFound) return originalStr;

  // We found the start string
  NSUInteger originalLength = originalStr.length;
  NSUInteger startOfTarget = NSMaxRange(startRange);
  NSRange targetAndRest = NSMakeRange(startOfTarget, originalLength - startOfTarget);
  NSRange endRange = [originalStr rangeOfString:endStr
                                        options:0
                                          range:targetAndRest];
  NSRange replaceRange;
  if (endRange.location == NSNotFound) {
    // Found no end marker so replace to end of string
    replaceRange = targetAndRest;
  } else {
    // Replace up to the endStr
    replaceRange = NSMakeRange(startOfTarget, endRange.location - startOfTarget);
  }
  NSString *result = [originalStr stringByReplacingCharactersInRange:replaceRange
                                                          withString:@"_snip_"];
  return result;
#endif // SKIP_GTM_FETCH_LOGGING_SNIPPING
}

+ (NSString *)headersStringForDictionary:(NSDictionary *)dict {
  // Format the dictionary in http header style, like
  //   Accept:        application/json
  //   Cache-Control: no-cache
  //   Content-Type:  application/json; charset=utf-8
  //
  // Pad the key names, but not beyond 16 chars, since long custom header
  // keys just create too much whitespace
  NSArray *keys = [dict.allKeys sortedArrayUsingSelector:@selector(compare:)];

  NSMutableString *str = [NSMutableString string];
  for (NSString *key in keys) {
    NSString *value = [dict valueForKey:key];
    if ([key isEqual:@"Authorization"]) {
      // Remove OAuth 1 token
      value = [[self class] snipSubstringOfString:value
                               betweenStartString:@"oauth_token=\""
                                        endString:@"\""];

      // Remove OAuth 2 bearer token (draft 16, and older form)
      value = [[self class] snipSubstringOfString:value
                               betweenStartString:@"Bearer "
                                        endString:@"\n"];
      value = [[self class] snipSubstringOfString:value
                               betweenStartString:@"OAuth "
                                        endString:@"\n"];

      // Remove Google ClientLogin
      value = [[self class] snipSubstringOfString:value
                               betweenStartString:@"GoogleLogin auth="
                                        endString:@"\n"];
    }
    [str appendFormat:@"  %@: %@\n", key, value];
  }
  return str;
}

@end

#endif // !STRIP_GTM_FETCH_LOGGING
