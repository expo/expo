struct SplashScreenConfigurationBuilder {
  static func parse(manifest: EXManifests.Manifest) -> ManagedAppSplashScreenConfiguration {
    let backgroundColor = manifest.iosSplashBackgroundColor()
    let imageUrl = manifest.iosSplashImageUrl() ?? manifest.iosAppIconUrl()
    let imageWidth = manifest.iosSplashImageWidth()

    return ManagedAppSplashScreenConfiguration(
      backgroundColor: backgroundColor,
      imageUrl: imageUrl,
      imageWidth: imageWidth
    )
  }
}
