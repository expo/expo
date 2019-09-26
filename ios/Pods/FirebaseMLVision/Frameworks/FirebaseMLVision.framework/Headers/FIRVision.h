#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRApp;
@class FIRVisionBarcodeDetector;
@class FIRVisionBarcodeDetectorOptions;
@class FIRVisionCloudDetectorOptions;
@class FIRVisionCloudDocumentTextRecognizerOptions;
@class FIRVisionCloudImageLabelerOptions;
@class FIRVisionCloudLandmarkDetector;
@class FIRVisionCloudTextRecognizerOptions;
@class FIRVisionDocumentTextRecognizer;
@class FIRVisionFaceDetector;
@class FIRVisionFaceDetectorOptions;
@class FIRVisionImageLabeler;
@class FIRVisionOnDeviceImageLabelerOptions;
@class FIRVisionTextRecognizer;

NS_ASSUME_NONNULL_BEGIN

/** A Firebase service that supports vision APIs.  */
NS_SWIFT_NAME(Vision)
@interface FIRVision : NSObject

/**
 * Enables stats collection in ML Kit vision. The stats include API call counts, errors, API call
 * durations, options, etc. No personally identifiable information is logged.
 *
 * <p>The setting is per `FirebaseApp`, and therefore per `Vision`, and it is persistent across
 * launches of the app. It means if the user uninstalls the app or clears all app data, the setting
 * will be erased. The best practice is to set the flag in each initialization.
 *
 * <p>By default the logging is enabled. You have to specifically set it to false to disable
 * logging.
 */
@property(nonatomic, getter=isStatsCollectionEnabled) BOOL statsCollectionEnabled;

/**
 * Gets an instance of Firebase Vision service for the default Firebase app. The default Firebase
 * app instance must be configured before calling this method; otherwise, raises FIRAppNotConfigured
 * exception.
 *
 * @return A Firebase Vision service instance, initialized with the default Firebase app.
 */
+ (instancetype)vision NS_SWIFT_NAME(vision());

/**
 * Gets an instance of Firebase Vision service for the custom Firebase app.
 *
 * @param app The custom Firebase app used for initialization. Raises FIRAppInvalid exception if
 *     `app` is nil.
 * @return A Firebase Vision service instance, initialized with the custom Firebase app.
 */
+ (instancetype)visionForApp:(FIRApp *)app NS_SWIFT_NAME(vision(app:));

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Gets a barcode detector with the given options.
 *
 * @param options Options containing barcode detector configuration.
 * @return A barcode detector configured with the given options.
 */
- (FIRVisionBarcodeDetector *)barcodeDetectorWithOptions:(FIRVisionBarcodeDetectorOptions *)options
    NS_SWIFT_NAME(barcodeDetector(options:));

/**
 * Gets a barcode detector with the default options.
 *
 * @return A barcode detector configured with the default options.
 */
- (FIRVisionBarcodeDetector *)barcodeDetector;

/**
 * Gets a face detector with the given options.
 *
 * @param options Options for configuring the face detector.
 * @return A face detector configured with the given options.
 */
- (FIRVisionFaceDetector *)faceDetectorWithOptions:(FIRVisionFaceDetectorOptions *)options
    NS_SWIFT_NAME(faceDetector(options:));

/**
 * Gets a face detector with the default options.
 *
 * @return A face detector configured with the default options.
 */
- (FIRVisionFaceDetector *)faceDetector;

/**
 * Gets an on-device image labeler with the given options.
 *
 * @param options Options for configuring the image labeler.
 * @return An on-device image labeler configured with the given options.
 */
- (FIRVisionImageLabeler *)onDeviceImageLabelerWithOptions:
    (FIRVisionOnDeviceImageLabelerOptions *)options NS_SWIFT_NAME(onDeviceImageLabeler(options:));

/**
 * Gets an on-device image labeler with the default options.
 *
 * @return An on-device image labeler configured with the default options.
 */
- (FIRVisionImageLabeler *)onDeviceImageLabeler;

/**
 * Gets an on-device text recognizer.
 *
 * @return A text recognizer.
 */
- (FIRVisionTextRecognizer *)onDeviceTextRecognizer;

/**
 * Gets a cloud text recognizer configured with the given options.
 *
 * @param options Options for configuring the cloud text recognizer.
 * @return A text recognizer configured with the given options.
 */
- (FIRVisionTextRecognizer *)cloudTextRecognizerWithOptions:
    (FIRVisionCloudTextRecognizerOptions *)options NS_SWIFT_NAME(cloudTextRecognizer(options:));

/**
 * Gets a cloud text recognizer.
 *
 * @return A text recognizer.
 */
- (FIRVisionTextRecognizer *)cloudTextRecognizer;

/**
 * Gets a cloud document text recognizer configured with the given options.
 *
 * @param options Options for configuring the cloud document text recognizer.
 * @return A document text recognizer configured with the given options.
 */
- (FIRVisionDocumentTextRecognizer *)cloudDocumentTextRecognizerWithOptions:
    (FIRVisionCloudDocumentTextRecognizerOptions *)options
    NS_SWIFT_NAME(cloudDocumentTextRecognizer(options:));

/**
 * Gets a cloud document text recognizer.
 *
 * @return A document text recognizer.
 */
- (FIRVisionDocumentTextRecognizer *)cloudDocumentTextRecognizer;

/**
 * Gets an instance of cloud landmark detector with the given options.
 *
 * @param options Options for configuring the cloud landmark detector.
 * @return A cloud landmark detector configured with the given options.
 */
- (FIRVisionCloudLandmarkDetector *)cloudLandmarkDetectorWithOptions:
    (FIRVisionCloudDetectorOptions *)options NS_SWIFT_NAME(cloudLandmarkDetector(options:));

/**
 * Gets an instance of cloud landmark detector with default options.
 *
 * @return A cloud landmark detector configured with default options.
 */
- (FIRVisionCloudLandmarkDetector *)cloudLandmarkDetector;

/**
 * Gets an instance of cloud image labeler with the given options.
 *
 * @param options Options for configuring the cloud image labeler.
 * @return A cloud image labeler configured with the given options.
 */
- (FIRVisionImageLabeler *)cloudImageLabelerWithOptions:(FIRVisionCloudImageLabelerOptions *)options
    NS_SWIFT_NAME(cloudImageLabeler(options:));

/**
 * Gets an instance of cloud image labeler with default options.
 *
 * @return A cloud image labeler configured with default options.
 */
- (FIRVisionImageLabeler *)cloudImageLabeler;

@end

NS_ASSUME_NONNULL_END
