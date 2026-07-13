// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class DependencyResolverTests: XCTestCase {
  // Mirrors NCL's SharingScreen (module 2369): mixed packages, a relative
  // component, jsx-runtime, and a png asset dep.
  private let sharingDeps = [559, 2270, 2370, 49, 280, 1779, 229, 2374]
  private let sharingSources: [Int: String] = [
    559: "/repo/packages/expo-asset/build/index.js",
    2270: "/repo/packages/expo-file-system/src/legacy/index.ts",
    2370: "/repo/packages/expo-sharing/build/index.js",
    49: "/repo/node_modules/react/index.js",
    280: "/repo/node_modules/react-native/index.js",
    1779: "/repo/apps/app/src/components/Button.tsx",
    229: "/repo/node_modules/react/jsx-runtime.js",
    2374: "/repo/apps/app/assets/images/chapeau.png",
  ]
  private let sharingNames = [
    "expo-asset", "expo-file-system/legacy", "expo-sharing", "react",
    "react-native", "../components/Button", "react/jsx-runtime",
    "../../assets/images/chapeau.png",
  ]
  private let modulePath = "/repo/apps/app/src/screens/SharingScreen.tsx"

  func testResolvesRealWorldModuleOneToOne() throws {
    let result = try DependencyResolver.resolve(
      names: sharingNames, dependencyIds: sharingDeps,
      sourcePathsById: sharingSources, moduleSourcePath: modulePath)
    XCTAssertEqual(result["expo-asset"], 0)
    XCTAssertEqual(result["react"], 3)
    XCTAssertEqual(result["../components/Button"], 5)
    XCTAssertEqual(result["react/jsx-runtime"], 6)
    XCTAssertEqual(result["../../assets/images/chapeau.png"], 7)
  }

  // 'react' matches both react/index.js and react/jsx-runtime.js by package
  // dir; elimination must assign jsx-runtime first, leaving index.js for
  // bare 'react'.
  func testEliminationDisambiguatesReactFromJsxRuntime() throws {
    let result = try DependencyResolver.resolve(
      names: ["react", "react/jsx-runtime"], dependencyIds: [49, 229],
      sourcePathsById: [49: "/r/node_modules/react/index.js", 229: "/r/node_modules/react/jsx-runtime.js"],
      moduleSourcePath: "/r/app/App.tsx")
    XCTAssertEqual(result["react"], 0)
    XCTAssertEqual(result["react/jsx-runtime"], 1)
  }

  // Metro records ESM import + inline require of the same file as two dep
  // entries; names resolve against unique ids and map to the FIRST index.
  func testDuplicateDependencyIdsCollapse() throws {
    let result = try DependencyResolver.resolve(
      names: ["./A", "./B"], dependencyIds: [10, 20, 10],
      sourcePathsById: [10: "/r/app/A.ts", 20: "/r/app/B.ts"],
      moduleSourcePath: "/r/app/entry.ts")
    XCTAssertEqual(result["./A"], 0)
    XCTAssertEqual(result["./B"], 1)
  }

  func testScopedPackageInUnscopedMonorepoDir() throws {
    // @expo/html-elements lives in packages/html-elements
    let result = try DependencyResolver.resolve(
      names: ["@expo/html-elements"], dependencyIds: [7],
      sourcePathsById: [7: "/repo/packages/html-elements/build/index.js"],
      moduleSourcePath: "/repo/apps/app/App.tsx")
    XCTAssertEqual(result["@expo/html-elements"], 0)
  }

  func testScopeFoldedMonorepoDir() throws {
    // @expo/ui lives in packages/expo-ui
    let result = try DependencyResolver.resolve(
      names: ["@expo/ui/swift-ui"], dependencyIds: [8],
      sourcePathsById: [8: "/repo/packages/expo-ui/src/swift-ui/index.ts"],
      moduleSourcePath: "/repo/apps/app/App.tsx")
    XCTAssertEqual(result["@expo/ui/swift-ui"], 0)
  }

  func testBareAliasFallsBackToBasename() throws {
    // ThemeProvider via tsconfig paths -> apps/common/ThemeProvider.tsx
    let result = try DependencyResolver.resolve(
      names: ["ThemeProvider"], dependencyIds: [5],
      sourcePathsById: [5: "/repo/apps/common/ThemeProvider.tsx"],
      moduleSourcePath: "/repo/apps/app/App.tsx")
    XCTAssertEqual(result["ThemeProvider"], 0)
  }

  func testRelativePlatformVariantResolves() throws {
    let result = try DependencyResolver.resolve(
      names: ["./Selector"], dependencyIds: [3],
      sourcePathsById: [3: "/r/app/Selector.ios.tsx"],
      moduleSourcePath: "/r/app/Screen.tsx")
    XCTAssertEqual(result["./Selector"], 0)
  }

  func testAddedImportThrowsCountMismatch() {
    XCTAssertThrowsError(try DependencyResolver.resolve(
      names: ["react", "expo-crypto"], dependencyIds: [49],
      sourcePathsById: [49: "/r/node_modules/react/index.js"],
      moduleSourcePath: "/r/app/App.tsx")
    ) { error in
      XCTAssertEqual(error as? DependencyResolver.ResolutionError, .countMismatch(found: 2, expected: 1))
    }
  }

  func testUnknownNameThrowsUnresolvable() {
    XCTAssertThrowsError(try DependencyResolver.resolve(
      names: ["expo-crypto"], dependencyIds: [49],
      sourcePathsById: [49: "/r/node_modules/react/index.js"],
      moduleSourcePath: "/r/app/App.tsx")
    ) { error in
      XCTAssertEqual(error as? DependencyResolver.ResolutionError, .unresolvable(name: "expo-crypto"))
    }
  }

  func testTrueAmbiguityThrows() {
    // two relative deps that both satisfy the same single name can never
    // happen, but two names sharing one surviving candidate can:
    XCTAssertThrowsError(try DependencyResolver.resolve(
      names: ["./A", "./A/index"], dependencyIds: [1, 2],
      sourcePathsById: [1: "/r/app/A/index.ts", 2: "/r/app/A/index.ios.ts"],
      moduleSourcePath: "/r/app/entry.ts")
    ) { error in
      guard case .ambiguous = error as? DependencyResolver.ResolutionError else {
        return XCTFail("expected .ambiguous, got \(error)")
      }
    }
  }
}
