
#import <EXFileSystem/EXFileSystemLocalFileHandler.h>

@implementation EXFileSystemLocalFileHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)options
              resolver:(EXPromiseResolveBlock)resolve
              rejecter:(EXPromiseRejectBlock)reject
{
  NSString *path = fileUri.path;
  BOOL isDirectory;
  if ([[NSFileManager defaultManager] fileExistsAtPath:path isDirectory:&isDirectory]) {
    NSDictionary *attributes = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:nil];
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"exists"] = @(true);
    result[@"isDirectory"] = @(isDirectory);
    result[@"uri"] = [NSURL fileURLWithPath:path].absoluteString;
    if (options[@"md5"]) {
      result[@"md5"] = [[NSData dataWithContentsOfFile:path] md5String];
    }
    result[@"size"] = attributes[NSFileSize];
    result[@"modificationTime"] = @(attributes.fileModificationDate.timeIntervalSince1970);
    resolve(result);
  } else {
    resolve(@{@"exists": @(false), @"isDirectory": @(false)});
  }
}

+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(EXPromiseResolveBlock)resolve
        rejecter:(EXPromiseRejectBlock)reject
{
  NSString *fromPath = [from.path stringByStandardizingPath];
  NSString *toPath = [to.path stringByStandardizingPath];
  
  NSError *error;
  if ([[NSFileManager defaultManager] fileExistsAtPath:toPath]) {
    if (![[NSFileManager defaultManager] removeItemAtPath:toPath error:&error]) {
      reject(@"E_FILE_NOT_COPIED",
             [NSString stringWithFormat:@"File '%@' could not be copied to '%@' because a file already exists at "
              "the destination and could not be deleted.", from, to],
             error);
      return;
    }
  }
  
  if ([[NSFileManager defaultManager] copyItemAtPath:fromPath toPath:toPath error:&error]) {
    resolve(nil);
  } else {
    reject(@"E_FILE_NOT_COPIED",
           [NSString stringWithFormat:@"File '%@' could not be copied to '%@'.", from, to],
           error);
  }
}

@end
