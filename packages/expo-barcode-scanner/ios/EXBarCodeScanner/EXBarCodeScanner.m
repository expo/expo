// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBarCodeScanner/EXBarCodeScanner.h>
#import <EXBarCodeScanner/EXBarCodeScannerUtils.h>
#import <UMBarCodeScannerInterface/UMBarCodeScannerInterface.h>
#import <UMCore/UMDefines.h>
#import <ZXingObjC/ZXingObjC.h>

@interface EXBarCodeScanner() <AVCaptureMetadataOutputObjectsDelegate, AVCaptureVideoDataOutputSampleBufferDelegate>

@property (nonatomic, strong) AVCaptureMetadataOutput *metadataOutput;
@property (nonatomic, weak) AVCaptureSession *session;
@property (nonatomic, weak) dispatch_queue_t sessionQueue;
@property (nonatomic, copy, nullable) void (^onBarCodeScanned)(NSDictionary*);
@property (nonatomic, assign, getter=isScanningBarCodes) BOOL barCodesScanning;
@property (nonatomic, strong) NSDictionary<NSString *, id> *settings;

@property (nonatomic, strong) ZXPDF417Reader *zxingBarcodeReader;
@property (nonatomic, assign) CGFloat zxingFPSProcessed;
@property (nonatomic, strong) AVCaptureVideoDataOutput* videoDataOutput;
@property (nonatomic, strong) dispatch_queue_t zxingCaptureQueue;

@end

NSString *const EX_BARCODE_TYPES_KEY = @"barCodeTypes";

@implementation EXBarCodeScanner

- (instancetype)init
{
  if (self = [super init]) {
    _settings = [[NSMutableDictionary alloc] initWithDictionary:[[self class] _getDefaultSettings]];

    // zxing only handles PDF417 barcodes reading
    _zxingBarcodeReader = [ZXPDF417Reader new];
    _zxingFPSProcessed = 6;
    _zxingCaptureQueue = dispatch_queue_create("com.zxing.captureQueue", NULL);
  }
  return self;
}

# pragma mark - JS properties setters

- (void)setSettings:(NSDictionary<NSString *, id> *)settings
{
  for (NSString *key in settings) {
    if ([key isEqualToString:EX_BARCODE_TYPES_KEY]) {
      NSArray<NSString *> *value = settings[key];
      NSSet *previousTypes = [NSSet setWithArray:_settings[EX_BARCODE_TYPES_KEY]];
      NSSet *newTypes = [NSSet setWithArray:value];
      if (![previousTypes isEqualToSet:newTypes]) {
        NSMutableDictionary<NSString *, id> *nextSettings = [[NSMutableDictionary alloc] initWithDictionary:_settings];
        nextSettings[EX_BARCODE_TYPES_KEY] = value;
        _settings = nextSettings;
        UM_WEAKIFY(self);
        [self _runBlockIfQueueIsPresent:^{
          UM_ENSURE_STRONGIFY(self);
          [self maybeStartBarCodeScanning];
        }];
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
  UM_WEAKIFY(self);
  [self _runBlockIfQueueIsPresent:^{
    UM_ENSURE_STRONGIFY(self);
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

  if (!_metadataOutput || !_videoDataOutput) {
    [_session beginConfiguration];

    if (!_metadataOutput) {
      AVCaptureMetadataOutput *metadataOutput = [[AVCaptureMetadataOutput alloc] init];
      [metadataOutput setMetadataObjectsDelegate:self queue:_sessionQueue];
      if ([_session canAddOutput:metadataOutput]) {
        [_session addOutput:metadataOutput];
        _metadataOutput = metadataOutput;
      }
    }

    if (!_videoDataOutput) {
      AVCaptureVideoDataOutput *videoDataOutput = [AVCaptureVideoDataOutput new];
      [videoDataOutput setVideoSettings:@{
        (NSString *)kCVPixelBufferPixelFormatTypeKey: [NSNumber numberWithUnsignedInt:kCVPixelFormatType_32BGRA],
      }];
      [videoDataOutput setAlwaysDiscardsLateVideoFrames:YES];
      [videoDataOutput setSampleBufferDelegate:self queue:_zxingCaptureQueue];
      if ([_session canAddOutput:videoDataOutput]) {
        [_session addOutput:videoDataOutput];
        _videoDataOutput = videoDataOutput;
      }
    }

    [_session commitConfiguration];

    if (!_metadataOutput) {
      return;
    }
  }

  NSArray<AVMetadataObjectType> *availableRequestedObjectTypes = @[];
  NSArray<AVMetadataObjectType> *requestedObjectTypes = @[];
  NSArray<AVMetadataObjectType> *availableObjectTypes = _metadataOutput.availableMetadataObjectTypes;
  if (_settings && _settings[EX_BARCODE_TYPES_KEY]) {
    requestedObjectTypes = [[NSArray alloc] initWithArray:_settings[EX_BARCODE_TYPES_KEY]];
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

  if ([_session.outputs containsObject:_videoDataOutput]) {
    [_session removeOutput:_videoDataOutput];
    _videoDataOutput = nil;
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
  if (!_settings || !_settings[EX_BARCODE_TYPES_KEY] || !_metadataOutput) {
    return;
  }

  for (AVMetadataObject *metadata in metadataObjects) {
    if ([metadata isKindOfClass:[AVMetadataMachineReadableCodeObject class]]) {
      AVMetadataMachineReadableCodeObject *codeMetadata = (AVMetadataMachineReadableCodeObject *) metadata;
      for (id barcodeType in _settings[EX_BARCODE_TYPES_KEY]) {
        // PDF417 is not reading '\0' (null) character correctly producing malformed results -> zxing handles it in separate flow
        if ([barcodeType isEqualToString:AVMetadataObjectTypePDF417Code]) {
          continue;
        }
        if (codeMetadata.stringValue && [codeMetadata.type isEqualToString:barcodeType]) {

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

# pragma mark - AVCaptureVideoDataOutputSampleBufferDelegate for ZXing

- (void)captureOutput:(AVCaptureVideoDataOutput *)output
didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer
       fromConnection:(AVCaptureConnection *)connection
{
  if (!_settings || !_settings[EX_BARCODE_TYPES_KEY] || !_metadataOutput) {
    return;
  }
  // do not use ZXing library if not scannnig PDF417 barcodes
  if (![_settings[EX_BARCODE_TYPES_KEY] containsObject:AVMetadataObjectTypePDF417Code]) {
    return;
  }

  // below code is mostly taken from ZXing library itself
  float kMinMargin = 1.0 / _zxingFPSProcessed;

  // Gets the timestamp for each frame.
  CMTime presentTimeStamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer);

  @autoreleasepool {
    static double curFrameTimeStamp = 0;
    static double lastFrameTimeStamp = 0;

    curFrameTimeStamp = (double)presentTimeStamp.value / presentTimeStamp.timescale;

    if (curFrameTimeStamp - lastFrameTimeStamp > kMinMargin) {
      lastFrameTimeStamp = curFrameTimeStamp;

      CVImageBufferRef videoFrame = CMSampleBufferGetImageBuffer(sampleBuffer);
      CGImageRef videoFrameImage = [ZXCGImageLuminanceSource createImageFromBuffer:videoFrame];
      [self scanBarcodesFromImage:videoFrameImage withCompletion:^(NSString* text, NSString* type, NSError* error){
        // text contains characteres u'\0' (null character) that malforme resulting string, so we get rid of them
        NSMutableString* data = [NSMutableString new];
        for (int i = 0; i < [text length]; i++) {
          if ([text characterAtIndex:i] != u'\0') {
            [data appendFormat:@"%c", [text characterAtIndex:i]];
          }
        }
        NSDictionary *event = @{
          @"type": type,
          @"data": data,
        };
        if (self->_onBarCodeScanned) {
          self->_onBarCodeScanned(event);
        }
      }];
    }
  }
}

- (void)scanBarcodesFromImage:(CGImageRef)image
               withCompletion:(void(^)(NSString* text, NSString* type, NSError* error))completion
{
  ZXCGImageLuminanceSource *source = [[ZXCGImageLuminanceSource alloc] initWithCGImage:image];
  CGImageRelease(image);

  ZXHybridBinarizer *binarizer = [[ZXHybridBinarizer alloc] initWithSource:source];
  ZXBinaryBitmap *bitmap = [[ZXBinaryBitmap alloc] initWithBinarizer:binarizer];

  NSError *error = nil;
  ZXResult *result = [_zxingBarcodeReader decode:bitmap
                                           hints:nil
                                           error:&error];
  // additionally zxing rotates bitmap by 180° internally
  if (!result && [bitmap rotateSupported]) {
    ZXBinaryBitmap *rotatedBitmap = [bitmap rotateCounterClockwise];
    result = [_zxingBarcodeReader decode:rotatedBitmap
                                   hints:nil
                                   error:&error];
  }

  if (result) {
    NSString* type = [EXBarCodeScanner zxingFormatToString:result.barcodeFormat];
    completion(result.text, type, error);
  }
}

+ (NSString *)zxingFormatToString:(ZXBarcodeFormat)format
{
  switch (format) {
    /** Aztec 2D barcode format. */
    case kBarcodeFormatAztec:
      return AVMetadataObjectTypeAztecCode;
    /** CODABAR 1D format. */
    case kBarcodeFormatCodabar:
      return @"Codabar";
    /** Code 39 1D format. */
    case kBarcodeFormatCode39:
      return AVMetadataObjectTypeCode39Code;
    /** Code 93 1D format. */
    case kBarcodeFormatCode93:
      return AVMetadataObjectTypeCode93Code;
    /** Code 128 1D format. */
    case kBarcodeFormatCode128:
      return AVMetadataObjectTypeCode128Code;
    /** Data Matrix 2D barcode format. */
    case kBarcodeFormatDataMatrix:
      return AVMetadataObjectTypeDataMatrixCode;
    /** EAN-8 1D format. */
    case kBarcodeFormatEan8:
      return AVMetadataObjectTypeEAN8Code;
    /** EAN-13 1D format. */
    case kBarcodeFormatEan13:
      return AVMetadataObjectTypeEAN13Code;
    /** ITF (Interleaved Two of Five) 1D format. */
    case kBarcodeFormatITF:
      return AVMetadataObjectTypeITF14Code;
    /** MaxiCode 2D barcode format. */
    case kBarcodeFormatMaxiCode:
      return @"MaxiCode";
    /** PDF417 format. */
    case kBarcodeFormatPDF417:
      return AVMetadataObjectTypePDF417Code;
    /** QR Code 2D barcode format. */
    case kBarcodeFormatQRCode:
      return AVMetadataObjectTypeQRCode;
    /** RSS 14 */
    case kBarcodeFormatRSS14:
      return @"RSS 14";
    /** RSS EXPANDED */
    case kBarcodeFormatRSSExpanded:
      return @"RSS Expanded";
    /** UPC-A 1D format. */
    case kBarcodeFormatUPCA:
      return @"UPCA";
    /** UPC-E 1D format. */
    case kBarcodeFormatUPCE:
      return AVMetadataObjectTypeUPCECode;
    /** UPC/EAN extension format. Not a stand-alone format. */
    case kBarcodeFormatUPCEANExtension:
      return @"UPC/EAN extension";

    default:
      return @"unknown";
  }
}

# pragma mark - default settings

+ (NSDictionary *)_getDefaultSettings
{
  return @{
           EX_BARCODE_TYPES_KEY: [[EXBarCodeScannerUtils validBarCodeTypes] allValues],
           };
}

@end
