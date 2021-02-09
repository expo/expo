# zxingify-objc

ZXingObjC is a full Objective-C port of [ZXing](https://github.com/zxing/zxing) ("Zebra Crossing"), a Java barcode image processing library. It is designed to be used on both iOS devices and in Mac applications.

The following barcodes are currently supported for both encoding and decoding:

* UPC-A and UPC-E
* EAN-8 and EAN-13
* Code 39
* Code 93
* Code 128
* ITF
* Codabar
* RSS-14 (all variants)
* QR Code
* Data Matrix
* Maxicode
* Aztec ('beta' quality)
* PDF 417 ('beta' quality)

ZXingObjC currently has feature parity with ZXing version 3.3.3.

## Requirements

ZXingObjC requires Xcode 8.3.3 and above, targeting either iOS 8.0 and above, or Mac OS X 10.8 Mountain Lion and above.

## Usage

Encoding:

```objc
NSError *error = nil;
ZXMultiFormatWriter *writer = [ZXMultiFormatWriter writer];
ZXBitMatrix* result = [writer encode:@"A string to encode"
                              format:kBarcodeFormatQRCode
                               width:500
                              height:500
                               error:&error];
if (result) {
  CGImageRef image = CGImageRetain([[ZXImage imageWithMatrix:result] cgimage]);

  // This CGImageRef image can be placed in a UIImage, NSImage, or written to a file.
  
  CGImageRelease(image);
} else {
  NSString *errorMessage = [error localizedDescription];
}
```

Decoding:

```objc
CGImageRef imageToDecode;  // Given a CGImage in which we are looking for barcodes

ZXLuminanceSource *source = [[[ZXCGImageLuminanceSource alloc] initWithCGImage:imageToDecode] autorelease];
ZXBinaryBitmap *bitmap = [ZXBinaryBitmap binaryBitmapWithBinarizer:[ZXHybridBinarizer binarizerWithSource:source]];

NSError *error = nil;

// There are a number of hints we can give to the reader, including
// possible formats, allowed lengths, and the string encoding.
ZXDecodeHints *hints = [ZXDecodeHints hints];

ZXMultiFormatReader *reader = [ZXMultiFormatReader reader];
ZXResult *result = [reader decode:bitmap
                            hints:hints
                            error:&error];
if (result) {
  // The coded result as a string. The raw data can be accessed with
  // result.rawBytes and result.length.
  NSString *contents = result.text;

  // The barcode format, such as a QR code or UPC-A
  ZXBarcodeFormat format = result.barcodeFormat;
} else {
  // Use error to determine why we didn't get a result, such as a barcode
  // not being found, an invalid checksum, or a format inconsistency.
}
```

## Installation

We highly recommend Carthage as module manager.

#### Carthage

ZXingObjC can be installed using [Carthage](https://github.com/Carthage/Carthage). After installing Carthage just add ZXingObjC to your Cartfile:

```ogdl
github "TheLevelUp/ZXingObjC" ~> 3.6
```

#### CocoaPods

[CocoaPods](http://cocoapods.org) is a dependency manager for Swift and Objective-C Cocoa projects. After installing CocoaPods add ZXingObjC to your Podfile:

```ruby
platform :ios, '8.0'
pod 'ZXingObjC', '~> 3.6.4'
```

## Examples

ZXingObjC includes several example applications found in "examples" folder:

* BarcodeScanner - An iOS application that captures video from the camera, scans for barcodes and displays results on screen.
* BarcodeScannerSwift - An iOS application that captures video from the camera, scans for barcodes and displays results on screen, completely rewritten in Swift.

## Kudos

- [cwalcott](https://github.com/cwalcott) initial creator of this project
- [neacao](https://github.com/neacao) for his unparalleled support lately
- [claybridges](https://github.com/claybridges) for all the help regarding the project move

## License

ZXingObjC is available under the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0.html).
