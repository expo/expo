// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import EXDevMenu

@Suite("ExpoLauncherURL")
struct ExpoLauncherURLTests {
  private func launch(_ string: String) -> ExpoLauncherURL {
    return ExpoLauncherURL(URL(string: string)!)
  }

  @Test
  func `legacy host with url only`() {
    let raw = "exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081"
    let launch = launch(raw)

    #expect(launch.isLauncherCommand)
    #expect(launch.isLegacyHost)
    #expect(launch.targetURL == URL(string: "http://10.0.0.5:8081"))
    #expect(!launch.disablesOnboarding)
    #expect(!launch.disablesFab)
    #expect(!launch.disablesAutoLaunch)
    #expect(launch.strippedURL.absoluteString == raw)
    #expect(launch.passthroughParams == ["url": "http://10.0.0.5:8081"])
  }

  @Test
  func `legacy host with url and disableOnboarding`() {
    let raw = "exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081&disableOnboarding=1"
    let launch = launch(raw)

    #expect(launch.isLauncherCommand)
    #expect(launch.targetURL == URL(string: "http://10.0.0.5:8081"))
    #expect(launch.disablesOnboarding)
    #expect(!launch.disablesFab)
    #expect(!launch.disablesAutoLaunch)
    // The legacy `url=` form is kept intact so apps and expo-router keep working.
    #expect(launch.strippedURL.absoluteString == raw)
  }

  @Test
  func `legacy disableFab and disableAutoLaunch are left to the launcher`() {
    let launch = launch("exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081&disableFab=1&disableAutoLaunch=1")

    #expect(!launch.disablesFab)
    #expect(!launch.disablesAutoLaunch)
    #expect(launch.passthroughParams["disableFab"] == "1")
  }

  @Test
  func `new shape with every reserved param`() {
    let launch = launch(
      "exp+slug://?__expo_url=http%3A%2F%2F10.0.0.5%3A8081" +
        "&__expo_disable_fab=1&__expo_disable_auto_launch=1&__expo_disable_onboarding=1"
    )

    #expect(launch.isLauncherCommand)
    #expect(!launch.isLegacyHost)
    #expect(launch.targetURL == URL(string: "http://10.0.0.5:8081"))
    #expect(launch.disablesFab)
    #expect(launch.disablesAutoLaunch)
    #expect(launch.disablesOnboarding)
    #expect(!launch.remainderHasDestination)
    #expect(launch.strippedURL.query == nil)
    #expect(launch.passthroughParams.isEmpty)
  }

  @Test
  func `app deep link carrying a reserved param`() {
    let launch = launch("myapp://login?__expo_disable_fab=1&x=1")

    #expect(launch.isLauncherCommand)
    #expect(launch.targetURL == nil)
    #expect(launch.disablesFab)
    #expect(launch.remainderHasDestination)
    #expect(launch.strippedURL.absoluteString == "myapp://login?x=1")
    #expect(launch.passthroughParams == ["x": "1"])
  }

  @Test
  func `new shape without a destination`() {
    let launch = launch("myapp://?__expo_url=http%3A%2F%2Flocalhost%3A8081")

    #expect(launch.targetURL == URL(string: "http://localhost:8081"))
    #expect(!launch.remainderHasDestination)
  }

  @Test
  func `plain app deep link is not a launcher command`() {
    let raw = "myapp://login?x=1"
    let launch = launch(raw)

    #expect(!launch.isLauncherCommand)
    #expect(launch.targetURL == nil)
    #expect(launch.strippedURL.absoluteString == raw)
    #expect(launch.passthroughParams == ["x": "1"])
  }

  @Test
  func `expo go url keeps the other params`() {
    let launch = launch("exp://h:8081/--/p?__expo_disable_fab=1&x=1")

    #expect(launch.isLauncherCommand)
    #expect(launch.disablesFab)
    #expect(launch.targetURL == nil)
    #expect(launch.remainderHasDestination)
    #expect(launch.strippedURL.absoluteString == "exp://h:8081/--/p?x=1")
  }

  @Test
  func `params inside the target url are ignored`() {
    let launch = launch("exp+slug://?__expo_url=http%3A%2F%2Flocalhost%3A8081%2F%3F__expo_disable_fab%3D1")

    #expect(!launch.disablesFab)
    #expect(launch.targetURL == URL(string: "http://localhost:8081/?__expo_disable_fab=1"))
  }

  @Test
  func `only exact values act`() {
    let launch = launch("exp://h:8081?__expo_disable_fab=0&__expo_disable_auto_launch=true&__expo_disable_onboarding=yes")

    #expect(launch.isLauncherCommand)
    #expect(!launch.disablesFab)
    #expect(!launch.disablesAutoLaunch)
    #expect(!launch.disablesOnboarding)
    #expect(launch.strippedURL.query == nil)
  }

  @Test
  func `unknown reserved params are stripped`() {
    let launch = launch("exp://h:8081?__expo_foo=1&x=1")

    #expect(launch.isLauncherCommand)
    #expect(launch.strippedURL.absoluteString == "exp://h:8081?x=1")
  }

  @Test
  func `legacy aliases only apply on the legacy host`() {
    let raw = "exp://h:8081?disableOnboarding=1&disableFab=1&disableAutoLaunch=1&url=http%3A%2F%2Fother"
    let launch = launch(raw)

    #expect(!launch.isLauncherCommand)
    #expect(!launch.disablesOnboarding)
    #expect(!launch.disablesFab)
    #expect(!launch.disablesAutoLaunch)
    #expect(launch.targetURL == nil)
    #expect(launch.strippedURL.absoluteString == raw)
  }

  @Test
  func `opaque url does not crash`() {
    let launch = launch("mailto:a@b.c")

    #expect(!launch.isLauncherCommand)
    #expect(launch.targetURL == nil)
    #expect(launch.strippedURL.absoluteString == "mailto:a@b.c")
  }

  @Test
  func `preserves percent encoding of the other params`() {
    let launch = launch("exp://h:8081/?snack-channel=a%2Bb&__expo_disable_fab=1")

    #expect(launch.strippedURL.absoluteString == "exp://h:8081/?snack-channel=a%2Bb")
  }
}
