---
title: Advanced ExponentKit Topics
---

This guide goes deeper into a few [ExponentKit](exponentkit.html) topics that aren't critical
right out of the box, but that you may encounter down the road. If you're not familiar with
ExponentKit, you might want to read [the ExponentKit guide](exponentkit.html) first.

## Verifying Bundles (iOS only)

When we serve your JS over-the-air to your ExponentKit project, we include a signature so that
your project can verify that the JS actually came from our servers.

By default, projects that use ExponentKit have this feature disabled on iOS and enabled on
Android. We encourage you to enable it on iOS so that your code is verified for all of your
users.

To enable code verification in your native project with ExponentKit:

-   Fulfill one of these two requirements (you only need one):

    -   Use a non-wildcard bundle identifier when provisioning the app (recommended)
    -   Enable **Keychain Sharing** in your Xcode project settings under **Capabilities**. (faster to
        set up)

-   In `ios/your-project/Supporting/EXShell.plist`, set `isManifestVerificationBypassed` to
    `NO` (or delete this key entirely).
