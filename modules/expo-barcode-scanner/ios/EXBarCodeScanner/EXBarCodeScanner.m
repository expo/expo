// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBarCodeScanner/EXBarCodeScanner.h>
#import <EXBarCodeScanner/EXBarCodeScannerUtils.h>
#import <EXBarCodeScannerInterface/EXBarCodeScannerInterface.h>
#import <EXCore/EXDefines.h>

@interface EXBarCodeScanner() <AVCaptureMetadataOutputObjectsDelegate>

@property (nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property (nonatomic, weak) AVCaptureSession *session;
@property (nonatomic, weak) dispatch_queue_t sessionQueue;
@property (nonatomic, copy, nullable) void (^onBarCodeScanned)(NSDictionary*);
@property (nonatomic, assign, getter=isScanningBarCodes) BOOL barCodesScanning;
@property (nonatomic, strong) NSDictionary<NSString *, id> *settings;

@end

NSString * const BARCODE_TYPES_KEY = @"barCodeTypes";

@implementation EXBarCodeScanner

- (instancetype)init
{
  if (self = [super init]) {
    _settings = [[NSMutableDictionary alloc] initWithDictionary:[[self class] _getDefaultSettings]];
  }
  return self;
}

# pragma mark - JS properties setters

- (void)setSettings:(NSDictionary<NSString *, id> *)settings
{
  for (NSString *key in settings) {
    if ([key isEqualToString:BARCODE_TYPES_KEY]) {
      NSArray<NSString *> *value = settings[key];
      NSSet *previousTypes = [NSSet setWithArray:_settings[BARCODE_TYPES_KEY]];
      NSSet *newTypes = [NSSet setWithArray:value];
      if (![previousTypes isEqualToSet:newTypes]) {
        NSMutableDictionary<NSString *, id> *nextSettings = [[NSMutableDictionary alloc] initWithDictionary:_settings];
        nextSettings[BARCODE_TYPES_KEY] = value;
        _settings = nextSettings;
        [self maybeStartBarCodeScanning];
      }
    }
  }
}

- (void)setIsEnabled:(BOOL)newBarCodeScanning
{
  if ([self isScanningBarCodes] == newBarCodeScanning) {
    return;
  }
  _barCodesScanning = newBarCodeScanning;
  EX_WEAKIFY(self);
  [self _runBlockIfQueueIsPresent:^{
    EX_ENSURE_STRONGIFY(self);
    if ([self isScanningBarCodes]) {
      if (self.metadataOutput) {
        [self _setConnectionsEnabled:true];
      } else {
        [self maybeStartBarCodeScanning];
      }
    } else {
      [self _setConnectionsEnabled:false];
    }
  }];
}

# pragma mark - Public API

- (void)maybeStartBarCodeScanning
{
  if (!_session || !_sessionQueue || ![self isScanningBarCodes]) {
    return;
  }
  
  if (!_metadataOutput) {
    [_session beginConfiguration];

    AVCaptureMetadataOutput *metadataOutput = [[AVCaptureMetadataOutput alloc] init];
    [metadataOutput setMetadataObjectsDelegate:self queue:_sessionQueue];
    if ([_session canAddOutput:metadataOutput]) {
      [_session addOutput:metadataOutput];
      _metadataOutput = metadataOutput;
    }
    [_session commitConfiguration];

    if (!_metadataOutput) {
      return;
    }
  }
  
  NSArray<AVMetadataObjectType> *availableRequestedObjectTypes = @[];
  NSArray<AVMetadataObjectType> *requestedObjectTypes = @[];
  NSArray<AVMetadataObjectType> *availableObjectTypes = _metadataOutput.availableMetadataObjectTypes;
  if (_settings && _settings[BARCODE_TYPES_KEY]) {
    requestedObjectTypes = [[NSArray alloc] initWithArray:_settings[BARCODE_TYPES_KEY]];
  }
  
  for(AVMetadataObjectType objectType in requestedObjectTypes) {
    if ([availableObjectTypes containsObject:objectType]) {
      availableRequestedObjectTypes = [availableRequestedObjectTypes arrayByAddingObject:objectType];
    }
  }
  
  [_metadataOutput setMetadataObjectTypes:availableRequestedObjectTypes];
}

- (void)stopBarCodeScanning
{
  if (!_session) {
    return;
  }
  
  [_session beginConfiguration];
  
  if ([_session.outputs containsObject:_metadataOutput]) {
    [_session removeOutput:_metadataOutput];
    _metadataOutput = nil;
  }
  
  [_session commitConfiguration];
  
  if ([self isScanningBarCodes] && _onBarCodeScanned) {
    _onBarCodeScanned(nil);
  }
}

# pragma mark - Private API

- (void)_setConnectionsEnabled:(BOOL)enabled
{
  if (!_metadataOutput) {
    return;
  }
  for (AVCaptureConnection *connection in _metadataOutput.connections) {
    connection.enabled = enabled;
  }
}

- (void)_runBlockIfQueueIsPresent:(void (^)(void))block
{
  if (_sessionQueue) {
    dispatch_async(_sessionQueue, block);
  }
}

# pragma mark - AVCaptureMetadataOutputObjectsDelegate

- (void)captureOutput:(AVCaptureOutput *)captureOutput didOutputMetadataObjects:(NSArray *)metadataObjects
       fromConnection:(AVCaptureConnection *)connection
{
  if (!_settings || !_settings[BARCODE_TYPES_KEY] || !_metadataOutput) {
    return;
  }
  
  for(AVMetadataObject *metadata in metadataObjects) {
    if([metadata isKindOfClass:[AVMetadataMachineReadableCodeObject class]]) {
      AVMetadataMachineReadableCodeObject *codeMetadata = (AVMetadataMachineReadableCodeObject *) metadata;
      for (id barcodeType in _settings[BARCODE_TYPES_KEY]) {
        if ([metadata.type isEqualToString:barcodeType]) {
          
          NSDictionary *event = @{
                                  @"type" : codeMetadata.type,
                                  @"data" : codeMetadata.stringValue
                                  };
          
          if (_onBarCodeScanned) {
            _onBarCodeScanned(event);
          }
          return;
        }
      }
    }
  }
}

# pragma mark - default settings

+ (NSDictionary *)_getDefaultSettings
{
  return @{
           BARCODE_TYPES_KEY: [[EXBarCodeScannerUtils validBarCodeTypes] allValues],
           };
}

@end
