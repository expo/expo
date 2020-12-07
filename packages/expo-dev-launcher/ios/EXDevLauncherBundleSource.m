#import "EXDevLauncherBundleSource.h"


@interface EXDevLauncherBundleSource ()
{
@public
  NSURL *_url;
  NSData *_data;
  NSUInteger _length;
  NSInteger _filesChangedCount;
}

@end

@implementation EXDevLauncherBundleSource

- (NSURL *)url {
  return self->_url;
}

- (NSData *)data {
  return self->_data;
}

- (NSUInteger)length {
  return self->_length;
}

- (NSInteger)filesChangedCount {
  return self->_filesChangedCount;
}

@end

EXDevLauncherBundleSource *EXDevLauncherBundleSourceCreate(NSURL *url, NSData *data, int64_t length) NS_RETURNS_RETAINED
{
  EXDevLauncherBundleSource *source = [[EXDevLauncherBundleSource alloc] init];
  source->_url = url;
  source->_data = data;
  source->_length = length;
  source->_filesChangedCount = RCTSourceFilesChangedCountNotBuiltByBundler;
  return source;
}
