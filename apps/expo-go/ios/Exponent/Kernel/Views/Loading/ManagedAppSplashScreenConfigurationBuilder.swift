struct ManagedAppSplashScreenConfigurationBuilder {
  static func parse(manifest: EXManifests.Manifest) -> ManagedAppSplashScreenConfiguration {
    let imageUrl = manifest.iosAppIconUrl()
    let resizeMode = parseImageResizeMode(manifest: manifest)
    let appName = manifest.name()
    return ManagedAppSplashScreenConfiguration(
      appName: appName,
      imageUrl: imageUrl,
      imageResizeMode: resizeMode)
  }
  
  private static func parseImageResizeMode(manifest: EXManifests.Manifest) -> SplashScreenImageResizeMode {
    return manifest.iosSplashImageResizeMode() == "cover" ? .cover : .contain
  }
}
