//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesUtils.h>

@interface EXUpdatesAsset ()

@property (nonatomic, readwrite, strong) NSString *contentHash;
@property (nonatomic, readwrite, strong) NSString *atomicHash;
@property (nonatomic, readwrite, strong) NSDictionary *headers;

@end

@implementation EXUpdatesAsset

- (instancetype)initWithUrl:(NSURL * _Nonnull)url type:(NSString * _Nonnull)type
{
  if (self = [super init]) {
    _url = url;
    _type = type;
  }
  return self;
}

- (NSString *)contentHash {
  if (!_contentHash) {
    if (_data) {
      _contentHash = [EXUpdatesUtils sha1WithData:_data];
    }
  }
  return _contentHash;
}

- (NSString *)atomicHash {
  if (!_atomicHash) {
    if (_data) {
      NSError *err;
      NSDictionary *metadata = _metadata;
      if (!metadata) {
        metadata = @{};
      }
      NSData *metadataJson = [NSJSONSerialization dataWithJSONObject:metadata options:kNilOptions error:&err];
      NSAssert (!err, @"asset metadata should be a valid object");
      NSString *stringToHash = [NSString stringWithFormat:@"%@-%@-%@",
                                _type, [[NSString alloc] initWithData:metadataJson encoding:NSUTF8StringEncoding], self.contentHash];
      _atomicHash = [EXUpdatesUtils sha1WithData:[stringToHash dataUsingEncoding:NSUTF8StringEncoding]];
    }
  }
  return _atomicHash;
}

- (NSDictionary *)headers {
  if (!_headers) {
    if (_response && [_response isKindOfClass:[NSHTTPURLResponse class]]) {
      _headers = [(NSHTTPURLResponse *)_response allHeaderFields];
    }
  }
  return _headers;
}

@end
