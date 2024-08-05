import Foundation

/// CachingPlayerItem global configuration.
public enum CachingPlayerItemConfiguration {
  public static var downloadBufferLimit: Int = 128.KB

  public static var readDataLimit: Int = 10.MB

  /// Flag for deciding whether an error should be thrown when URLResponse's expectedContentLength is not equal with the downloaded media file bytes count. Defaults to `false`.
  public static var shouldVerifyDownloadedFileSize: Bool = false
}
