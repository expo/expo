#import "EXDevelopmentClientBundleSource.h"


@interface EXDevelopmentClientBundleSource ()
{
@public
  NSURL *_url;
  NSData *_data;
  NSUInteger _length;
  NSInteger _filesChangedCount;
}

@end

@implementation EXDevelopmentClientBundleSource

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

EXDevelopmentClientBundleSource *EXDevelopmentClientBundleSourceCreate(NSURL *url, NSData *data, int64_t length) NS_RETURNS_RETAINED
{
  EXDevelopmentClientBundleSource *source = [[EXDevelopmentClientBundleSource alloc] init];
  source->_url = url;
  source->_data = data;
  source->_length = length;
  source->_filesChangedCount = RCTSourceFilesChangedCountNotBuiltByBundler;
  return source;
}
