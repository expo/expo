---
title: Protocol
sidebar_title: Protocol
---
## Request
The following headers must be included:
```
accept: "application/expo+json,application/json"
expo-platform: string
expo-runtimeVersion: string
expo-channel-name: string
expo-accept-signature: boolean
```
Along with any headers dictated by a previous responses `expo-server-defined-headers`. 

## Response
The following headers must be included:

```
expo-protocol-version: 0
expo-manifest-signature-version: 0
expo-manifest-signature: string
expo-sfv-version: 0
expo-manifest-filters: expo-sfv
expo-server-defined-headers: expo-sfv
cache-control: *
content-type: application/json; charset=utf-8
```
### Header Details:
  * `expo-manifest-signature` version `0` is a RSA SHA256 signature of the manifest body.
  * [expo-sfv](expo-sfv.md) version `0` is a partial implemntation of [Structured Field Values](https://tools.ietf.org/html/rfc8941)
  * `expo-manifest-filters` is a sfv-dictionary and is used to filter the updates stored by the client by `updateMetadata` attributes. For example: `expo-manifest-filters: branchname="main"` instructs the client to load the most recent update it has stored whose `updateMetadata` contains:
    ```
    updateMetadata: {
      branchname: 'main',
      ...
    }
    ```
  * `expo-server-defined-headers`  is a sfv-dictionary is used to instruct the client to send headers on all future requests to the server. For example, during a rollout we ask a client to send back a stable token: `expo-server-defined-headers: expo-rollout-token="token"`
  * `cache-control` We recommend `cache-control: private, max-age=0`, but the only requirement is that it is a reasonable time frame. Please keep in mind that updates should be expected to be regularly created and the cache policy should not block this.


Let an `Asset` be:
```
Asset: {
  hash: string
  key: string
  contentType: string
  url: string
}
```
then the response body is referred to as the `manifest` and must be a json with format:
```
{
  id: string
  createdAt: date
  runtimeVersion: string
  launchAsset: Asset,
  assets: Asset[],
  updateMetadata: {
    updateGroup: string
    updateGroupCreatedAt: date
    branchName: string
  }
}
```
### Body Details
  * `id` The ID must uniquely specify the manifest, however the different headers may accompany identical IDs in a response.
  * `createdAt` Time created is essential as the client selects the most recent update (subject to any contraints supplied in the `expo-manifest-filters` header).
  * `runtimeVersion`
  * `Asset` Provides information about the asset.
    * `hash` SHA256 hash of the file to guarantee integrity.
    * `key` Key used by the bundler.
    * `contentType` e.g. `application/javascript`, `image/jpeg`.
    * `url` Location where the asset is hosted.
  * `launchAsset` The asset that should be used to launch the app.
  * `assets` Assets used by the app, such as photos or fonts.
  * `updateMetadata` The meta data associated with an update can be used for filtering the update (branchName) and also for the creation of more helpful errors.

