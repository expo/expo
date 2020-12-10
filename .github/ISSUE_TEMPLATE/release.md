---
name: "🎢 Expo SDK release"
about: Issue template for SDK releases. Intended for repository maintainers only.
title: 'Release SDK'
labels: 'release'
assignees: ''

---

## 🎢 SDK Release

### [Stage 0 - Infra &amp; Prerelease](https://git.io/JeKCx#stage-0---infra--prerelease)

- [ ] [0.1. Dropping old SDKs](https://git.io/JeKCx#01-dropping-old-sdks)
  - [ ] Android
  - [ ] iOS
- [ ] [0.2. Update schema on staging](https://git.io/JeKCx#02-update-schema-on-staging)
- [ ] [0.3. Update versions on staging](https://git.io/JeKCx#03-update-versions-on-staging)

### [Stage 1 - Unversioned Quality Assurance and Versioning](https://git.io/JeKCx#stage-1---unversioned-quality-assurance-and-versioning)

- [ ] [1.1. Cutting off release branch](https://git.io/JeKCx#11-cutting-off-release-branch)
- [ ] [1.2. Update React Native](https://git.io/JeKCx#12-update-react-native)
- [ ] [1.3. Unversioned Quality Assurance](https://git.io/JeKCx#13-unversioned-quality-assurance)
  - [ ] Android
  - [ ] iOS
- [ ] [1.4. Versioning code for the new SDK](https://git.io/JeKCx#14-versioning-code-for-the-new-sdk)
  - [ ] Android
  - [ ] iOS
### [Stage 2 - Quality Assurance](https://git.io/JeKCx#stage-2---quality-assurance)

- [ ] [2.1. Versioned Quality Assurance - iOS/Android clients](https://git.io/JeKCx#21-versioned-quality-assurance---iosandroid-clients)
  - [ ] Android
  - [ ] iOS
- [ ] [2.2. Standalone App Quality Assurance](https://git.io/JeKCx#22-standalone-app-quality-assurance)
  - [ ] Android
  - [ ] iOS
- [ ] [2.3. Web Quality Assurance](https://git.io/JeKCx#23-web-quality-assurance)
- [ ] [2.4. Cherry-pick Versioned Code to master](https://git.io/JeKCx#24-cherry-pick-versioned-code-to-master)
  - [ ] Android
  - [ ] iOS
- [ ] [2.5. Publish demo apps](https://git.io/JeKCx#25-publish-demo-apps)
	- [ ] Publish to `applereview` account
	- [ ] Publish to `community` account

### [Stage 3 - Prerelease](https://git.io/JeKCx#stage-3---prerelease)

- [ ] [3.1. Tag React Native fork](https://git.io/JeKCx#31-tag-react-native-fork)
- [ ] [3.2. Generate new mocks](https://git.io/JeKCx#32-generate-new-mocks)
- [ ] [3.3. Publishing next packages](https://git.io/JeKCx#33-publishing-next-packages)
- [ ] [3.4. Publishing next project templates](https://git.io/JeKCx#34-publishing-next-project-templates)

### [Stage 4 - Expo client](https://git.io/JeKCx#stage-4---expo-client)

- [ ] [4.1. Releasing beta version](https://git.io/JeKCx#41-releasing-beta-version)
  - [ ] Android
  - [ ] iOS
- [ ] [4.2. Making a simulator build](https://git.io/JeKCx#42-making-a-simulator-build)
- [ ] [4.3. Submit iOS client to App Store Review](https://git.io/JeKCx#43-submit-ios-client-to-app-store-review)
- [ ] [4.4. Release clients to external beta testers](https://git.io/JeKCx#44-release-clients-to-external-beta-testers)
  - [ ] Android
  - [ ] iOS

### [Stage 5 - Standalone apps](https://git.io/JeKCx#stage-5---standalone-apps)

- [ ] [5.1. Updating JS dependencies required for build](https://git.io/JeKCx#51-updating-js-dependencies-required-for-build)
- [ ] [5.2. Make shell app build](https://git.io/JeKCx#52-make-shell-app-build)
  - [ ] Android
  - [ ] iOS
- [ ] [5.3. Make adhoc client shell app for iOS](https://git.io/JeKCx#53-make-adhoc-client-shell-app-for-ios)
- [ ] [5.4. Deploy Turtle with new shell tarballs](https://git.io/JeKCx#54-deploy-turtle-with-new-shell-tarballs)
  - [ ] Android
  - [ ] iOS

### [Stage 6 - Final release](https://git.io/JeKCx#stage-6---final-release)

- [ ] [6.1. Release iOS/Android clients](https://git.io/JeKCx#61-release-iosandroid-clients)
- [ ] [6.2. Deploy Turtle to production](https://git.io/JeKCx#62-deploy-turtle-to-production)
- [ ] [6.3. Generate and deploy new docs](https://git.io/JeKCx#63-generate-and-deploy-new-docs)
- [ ] [6.4. Add related packages to versions endpoint](https://git.io/JeKCx#64-add-related-packages-to-versions-endpoint)
- [ ] [6.5. Promote versions to production](https://git.io/JeKCx#65-promote-versions-to-production)
- [ ] [6.6. Promote packages to latest on NPM registry](https://git.io/JeKCx#66-promote-packages-to-latest-on-npm-registry)
- [ ] [6.7. Publishing final project templates](https://git.io/JeKCx#67-publishing-final-project-templates)
- [ ] [6.8. Press release](https://git.io/JeKCx#68-press-release)
- [ ] [6.9. Follow-up](https://git.io/JeKCx#69-follow-up)

### [Stage 7 - Snack](https://git.io/JeKCx#stage-7---snack)

- [ ] [7.1. Add SDK support to Snack](https://git.io/JeKCx#71-add-sdk-support-to-snack)
