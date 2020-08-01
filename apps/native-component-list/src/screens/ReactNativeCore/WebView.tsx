import * as React from 'react';
import { View } from 'react-native';
import WebView from 'react-native-webview';

import Layout from '../../constants/Layout';
import { Page, Section } from './CommonViews';

// TODO: Support web
export function WebViewExample() {
  // A parent view with overflow: 'hidden' ensures that the other components render properly.
  // See: https://github.com/facebook/react-native/issues/21939
  return (
    <Page>
      <Section title="Default">
        <View style={{ overflow: 'hidden' }}>
          <WebView
            style={{ width: Layout.window.width, height: 250 }}
            source={{
              html: `
          <h2>You can always use a WebView if you need to!</h2>
          <p>
            <h4>But don't the other components above seem like better building blocks for most of your UI?</h4>
            <input type="text" placeholder="Disagree? why?"></input>
            <input type="submit">
          </p>
          <p>
            <a href="https://expo.io">expo.io</a>
          </p>
        `,
            }}
          />
        </View>
      </Section>
    </Page>
  );
}
