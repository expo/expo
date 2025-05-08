struct SplashScreenConfigurationBuilder {
  static func parse(manifest: EXManifests.Manifest) -> ManagedAppSplashScreenConfiguration {
    let imageUrl = manifest.iosAppIconUrl()
    let resizeMode: SplashScreenImageResizeMode = manifest.iosSplashImageResizeMode() == "cover" ? .cover : .contain
    let appName = manifest.name()
    return ManagedAppSplashScreenConfiguration(
      appName: appName,
      imageUrl: imageUrl,
      imageResizeMode: resizeMode)
  }
}
