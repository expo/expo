// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXDevMenu

/// Service for creating and managing code playgrounds.
/// Internally uses the Snack infrastructure but presents as "playgrounds" in the UI.
class PlaygroundService {
  static let shared = PlaygroundService()

  private let templateSnackId = "@brents/code-playground"

  /// Default code for a new blank playground
  static let defaultCode: [String: SnackSessionClient.SnackFile] = [
    "App.js": SnackSessionClient.SnackFile(
      path: "App.js",
      contents: """
        import { Text, View, StyleSheet } from 'react-native';

        export default function App() {
          return (
            <View style={styles.container}>
              <Text style={styles.text}>Welcome to your playground!</Text>
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
          },
          text: {
            fontSize: 18,
          },
        });
        """,
      isAsset: false
    )
  ]

  func generateChannelId() -> String {
    return UUID().uuidString.lowercased()
  }

  func buildRuntimeUrl(channel: String, sdkVersion: String) -> String {
    "exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk:\(sdkVersion)&channel-name=production&snack-channel=\(channel)"
  }

  func getTemplateSnackId() -> String {
    return templateSnackId
  }
}
