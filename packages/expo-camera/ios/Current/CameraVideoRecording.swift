import UIKit
import AVFoundation
import ExpoModulesCore

protocol CameraVideoRecordingDelegate: AnyObject {
  var responsiveWhenOrientationLocked: Bool { get }
  var physicalOrientation: UIDeviceOrientation { get }
  var mirror: Bool { get }
  var appContext: AppContext? { get }
  var videoBitrate: Int? { get }
}

class CameraVideoRecording: NSObject, AVCaptureFileOutputRecordingDelegate {
  weak var delegate: CameraVideoRecordingDelegate?

  private var videoRecordedPromise: Promise?
  private var videoCodecType: AVVideoCodecType?
  private var isValidVideoOptions = true

  init(delegate: CameraVideoRecordingDelegate) {
    self.delegate = delegate
    super.init()
  }

  func record(options: CameraRecordingOptions, videoFileOutput: AVCaptureMovieFileOutput, promise: Promise) async {
    guard !videoFileOutput.isRecording && videoRecordedPromise == nil else {
      return
    }

    if let connection = videoFileOutput.connection(with: .video) {
      let orientation = delegate?.responsiveWhenOrientationLocked == true ?
        delegate?.physicalOrientation ?? .unknown : UIDevice.current.orientation
      connection.videoOrientation = ExpoCameraUtils.videoOrientation(for: orientation)
      await setVideoOptions(options: options, for: connection, videoFileOutput: videoFileOutput, promise: promise)

      if connection.isVideoOrientationSupported && delegate?.mirror == true {
        connection.isVideoMirrored = delegate?.mirror ?? false
      }
    }

    if !isValidVideoOptions {
      return
    }

    guard let appContext = delegate?.appContext else {
      promise.reject(CameraRecordingFailedException())
      return
    }

    let path = FileSystemUtilities.generatePathInCache(appContext, in: "Camera", extension: ".mov")
    let fileUrl = URL(fileURLWithPath: path)
    videoRecordedPromise = promise

    videoFileOutput.startRecording(to: fileUrl, recordingDelegate: self)
  }

  @available(iOS 18.0, *)
  func toggleRecording(videoFileOutput: AVCaptureMovieFileOutput) {
    if videoFileOutput.isRecordingPaused {
      videoFileOutput.resumeRecording()
    } else {
      videoFileOutput.pauseRecording()
    }
  }

  func stopRecording(videoFileOutput: AVCaptureMovieFileOutput?) {
    videoFileOutput?.stopRecording()
  }

  private func setVideoOptions(
    options: CameraRecordingOptions,
    for connection: AVCaptureConnection,
    videoFileOutput: AVCaptureMovieFileOutput,
    promise: Promise
  ) async {
    isValidVideoOptions = true

    if let maxDuration = options.maxDuration {
      videoFileOutput.maxRecordedDuration = CMTime(seconds: maxDuration, preferredTimescale: 1000)
    }

    if let maxFileSize = options.maxFileSize {
      videoFileOutput.maxRecordedFileSize = Int64(maxFileSize)
    }

    if let codec = options.codec {
      let codecType = codec.codecType()
      if videoFileOutput.availableVideoCodecTypes.contains(codecType) {
        var outputSettings: [String: Any] = [AVVideoCodecKey: codecType]
        if let videoBitrate = delegate?.videoBitrate {
          outputSettings[AVVideoCompressionPropertiesKey] = [AVVideoAverageBitRateKey: videoBitrate]
        }
        videoFileOutput.setOutputSettings(outputSettings, for: connection)
        self.videoCodecType = codecType
      } else {
        promise.reject(CameraRecordingException(options.codec?.rawValue))
        videoRecordedPromise = nil
        isValidVideoOptions = false
      }
    }
  }

  func fileOutput(
    _ output: AVCaptureFileOutput,
    didFinishRecordingTo outputFileURL: URL,
    from connections: [AVCaptureConnection],
    error: Error?
  ) {
    var success = true

    if error != nil {
      let value = (error as? NSError)?.userInfo[AVErrorRecordingSuccessfullyFinishedKey] as? Bool
      success = value == true ? true : false
    }

    if success && videoRecordedPromise != nil {
      videoRecordedPromise?.resolve(["uri": outputFileURL.absoluteString])
    } else if videoRecordedPromise != nil {
      videoRecordedPromise?.reject(CameraRecordingFailedException())
    }

    videoRecordedPromise = nil
    videoCodecType = nil
  }

  func cleanup() {
    videoRecordedPromise?.reject(CameraUnmountedException())
    videoRecordedPromise = nil
    videoCodecType = nil
  }
}
