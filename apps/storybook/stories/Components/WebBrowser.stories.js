import React from 'react';

export const title = 'Web Browser';
export const packageJson = require('expo-web-browser/package.json');
export const label = 'WebBrowser';

export const description = `Provides access to the system's web browser and supports handling redirects. 
On iOS, it uses \`SFSafariViewController\` or \`SFAuthenticationSession\`, depending on the method you call, and on Android it uses \`ChromeCustomTabs\`. As of iOS 11, \`SFSafariViewController\` no longer shares cookies with the Safari, so if you are using \`WebBrowser\` for authentication you will want to use \`WebBrowser.openAuthSessionAsync\`, and if you just want to open a webpage (such as your app privacy policy), then use \`WebBrowser.openBrowserAsync\`.`;

export const component = true;
