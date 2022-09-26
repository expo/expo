---
title: iOS Developer Mode
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

On devices running iOS 16 and above, you will need to enable a special OS-level "Developer Mode" before you can run [internal distribution](../build/internal-distribution) builds (including those built with EAS) or local development builds installed on the device.

This does not apply to builds signed using enterprise provisioning, nor to any builds installed on an iOS simulator.

To enable Developer Mode on your iOS 16+ device, follow the instructions below (once per device). On some devices, the option to enable it might not show until the build is installed.

- In the Settings app, navigate to "Privacy & Security" > "Developer Mode".

<ImageSpotlight alt="Navigating to Developer Mode setting" src="/static/images/ios-16-developer-mode-1.png" style={{maxWidth: 480}} />

- Enable the toggle if it isn't already on. You will receive a prompt from iOS to restart your device. Press "Restart" to do so.

<ImageSpotlight alt="Developer Mode restart prompt" src="/static/images/ios-16-developer-mode-2.png" style={{maxWidth: 480}} />

- After the device restarts, unlock your device; a system alert should appear. Press "Turn On" and then, when prompted, enter your passcode.

<ImageSpotlight alt="Alert and passcode prompt" src="/static/images/ios-16-developer-mode-3.png" style={{maxWidth: 480}} />

Developer Mode is now enabled, and you can now run internal distribution builds and local development builds.

You can turn off Developer Mode at any time, but note that you'll need to follow this same process again in order to re-enable it.
