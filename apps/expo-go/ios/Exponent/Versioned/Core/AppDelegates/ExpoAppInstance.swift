import React

@objc public final class ExpoAppInstance: RCTAppDelegate {
  private let sourceURL: URL
  
  @objc init(sourceURL: URL) {
    self.sourceURL = sourceURL
  }
  
  public override func bundleURL() -> URL? {
    return sourceURL
  }
}
