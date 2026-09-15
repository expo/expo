import UIKit
import AVFoundation
import ExpoModulesCore

protocol CameraVideoRecordingDelegate: AnyObject {
  var responsiveWhenOrientationLocked: Bool { get }
  var physicalOrientation: UIDeviceOrientation { get }
  var deviceOrientation: UIInterfaceOrientation { get }
  var mirror: Bool { get }
  var appContext: AppContext? { get }
  var videoBitrate: Int? { get }
  var videoStabilizationMode: VideoStabilizationMode { get }
  var onRecordingProgress: EventDispatcher { get }
}

class CameraVideoRecording: NSObject, AVCaptureFileOutputRecordingDelegate {
  weak var delegate: CameraVideoRecordingDelegate?

  private var videoRecordedPromise: Promise?
  private var videoCodecType: AVVideoCodecType?
  private var isValidVideoOptions = true
  private var progressTimer: Timer?
  private var maxDuration: Double?
  private var progressInterval: Double = 0.5
  private var isProgressActive = false

  init(delegate: CameraVideoRecordingDelegate) {
    self.delegate = delegate
    super.init()
  }

  func record(options: CameraRecordingOptions, videoFileOutput: AVCaptureMovieFileOutput, promise: Promise) async {
    guard !videoFileOutput.isRecording && videoRecordedPromise == nil else {
      return
    }

    if let connection = videoFileOutput.connection(with: .video) {
      connection.videoOrientation = await ExpoCameraUtils.captureOrientation(
        responsiveWhenOrientationLocked: delegate?.responsiveWhenOrientationLocked == true,
        physicalOrientation: delegate?.physicalOrientation ?? .unknown,
        interfaceOrientation: delegate?.deviceOrientation ?? .unknown
      )
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
    let maxDuration = options.maxDuration
    let progressInterval = max(0.1, options.progressUpdateInterval)
    DispatchQueue.main.async { [weak self] in
      self?.maxDuration = maxDuration
      self?.progressInterval = progressInterval
      self?.isProgressActive = true
    }

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

    let avMode = (delegate?.videoStabilizationMode ?? .auto).toAVCaptureVideoStabilizationMode()
    if connection.isVideoStabilizationSupported {
      connection.preferredVideoStabilizationMode = avMode
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

  func fileOutput(_ output: AVCaptureFileOutput, didStartRecordingTo fileURL: URL, from connections: [AVCaptureConnection]) {
    DispatchQueue.main.async { [weak self, weak output] in
      self?.startProgressTimer(for: output)
    }
  }

  private func startProgressTimer(for output: AVCaptureFileOutput?) {
    guard isProgressActive else { return }
    progressTimer?.invalidate()
    let timer = Timer(timeInterval: progressInterval, repeats: true) { [weak self, weak output] timer in
      guard let self, let output else {
        timer.invalidate()
        return
      }
      guard output.recordedDuration.isNumeric else {
        return
      }
      var payload: [String: Any] = [
        "duration": output.recordedDuration.seconds,
        "fileSize": output.recordedFileSize
      ]
      if let maxDuration = self.maxDuration {
        payload["maxDuration"] = maxDuration
      }
      self.delegate?.onRecordingProgress(payload)
    }
    RunLoop.main.add(timer, forMode: .common)
    progressTimer = timer
  }

  private func stopProgressUpdates() {
    // maxDuration is set on the main queue in record(), so clear it there too.
    DispatchQueue.main.async { [weak self] in
      self?.isProgressActive = false
      self?.progressTimer?.invalidate()
      self?.progressTimer = nil
      self?.maxDuration = nil
    }
  }

  func fileOutput(_ output: AVCaptureFileOutput, didPauseRecordingTo fileURL: URL, from connections: [AVCaptureConnection]) {
    DispatchQueue.main.async { [weak self] in
      self?.progressTimer?.invalidate()
      self?.progressTimer = nil
    }
  }

  func fileOutput(_ output: AVCaptureFileOutput, didResumeRecordingTo fileURL: URL, from connections: [AVCaptureConnection]) {
    DispatchQueue.main.async { [weak self, weak output] in
      self?.startProgressTimer(for: output)
    }
  }

  func fileOutput(
    _ output: AVCaptureFileOutput,
    didFinishRecordingTo outputFileURL: URL,
    from connections: [AVCaptureConnection],
    error: Error?
  ) {
    defer {
      videoRecordedPromise = nil
      videoCodecType = nil
      stopProgressUpdates()
    }

    let success = error == nil
      || (error as? NSError)?.userInfo[AVErrorRecordingSuccessfullyFinishedKey] as? Bool == true

    if success {
      videoRecordedPromise?.resolve(["uri": outputFileURL.absoluteString])
    } else {
      videoRecordedPromise?.reject(CameraRecordingFailedException())
    }
  }

  func cleanup() {
    videoRecordedPromise?.reject(CameraUnmountedException())
    videoRecordedPromise = nil
    videoCodecType = nil
    stopProgressUpdates()
  }
}
