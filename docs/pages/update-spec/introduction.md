---
title: Update Spec
sidebar_title: EAS Update
---
## Introduction

This is the specification for EAS Update, a protocol for managing over the air updates to apps running on multiple platforms.

### Conformance

Conforming servers and clients must fulfill all normative requirements. Conformance requirements are described in this document via both descriptive assertions and key words with clearly defined meanings.

The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in the normative portions of this document are to be interpreted as described in [IETF RFC 2119](https://tools.ietf.org/html/rfc2119). These key words may appear in lowercase and still retain their meaning unless explicitly declared as non‐normative.

A conforming implementation of may provide additional functionality, but must not where explicitly disallowed or would otherwise result in non‐conformance.

### Overview

EAS Update is a protocol for managing over the air updates to an app running on multiple platforms. 
In particular, it is a protocol for obtaining `updates`: an `update` is a [manifest](#manifest) together with the assets it references.

An app running a conformant EAS Update client will load the most recent update saved by the client.

In order to obtain an `update` a client starts with a [request](#request). 
  1. If the response body is a new manifest (checking the manifest ID is sufficient) it proceeds to download and store the assets refenced by the manifest.
  2. It updates the local state according to any metadata provided by the response [headers](#headers)

We anticipate the primary user of this spec will be companies who need to manage their own update server to satisfy internal requirements.

## Request
A conformant client MUST make a GET request with the following standard headers:

```
accept: application/expo+json,application/json
expo-platform: string
expo-runtime-version: string
expo-channel-name: string
```
Along with any headers stipulated by a previous responses' [server defined headers](#server-defined-headers):
  * `expo-platform` MUST be platform type the client is running on: 
      * iOS MUST be `expo-platform: ios`
      * android MUST be `expo-platform: android`
  * `expo-runtime-version` MUST be the runtime version the client is running on.
  * `expo-channel-name` MUST be the name of the channel that the client is associated with.

If the client wishes to verify the integrity of the request it may require a a signature be included as a response header `expo-manifest-signature`:
```
expo-accept-signature: boolean
```


## Response

A conformant server MUST return a body containing the [manifest](#manifest) along with the [headers](#headers) specified below.

The choice of manifest and headers are dependent on the values of the request headers. A conformant server MUST:

* Return a manifest that describes an `update` capable of running on the platform and runtime version specifice in the `expo-platform` and `expo-runtime-version` request headers. 
* Return a `manifest` that describes the most recent, sorted by creation time, `update` satisfying the constraints imposed by:
  * The `expo-channel-name` 
  * Server defined headers such as `expo-rollout-token`

### Headers

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
  * `expo-protocol-version` MUST be `0`
  * `expo-manifest-signature-version` MUST be `0`
  * `expo-manifest-signature` version `0` MUST be an RSA SHA256 signature of the response body.
  * `expo-sfv-version` MUST be `0`
  * `expo-sfv`   [expo-sfv](expo-sfv.md) version `0` is a partial implementation of Structured Field Values outlined in [IETF RFC 8941](https://tools.ietf.org/html/rfc8941)
  * `expo-manifest-filters` is an [expo-sfv](expo-sfv.md) dictionary and is used to filter the updates stored by the client by `updateMetadata` attributes found in the [manifest](#manifest).
  
  For example: `expo-manifest-filters: branchname="main"` instructs the client to load the most recent update it has stored whose `updateMetadata` contains:
    ```
    updateMetadata: {
      branchname: 'main',
      ...
    }
    ```
  If the `branchname` manifest filter is included, it MUST equal the `branchName` in the `manifest.updateMetadata`.
  * `expo-server-defined-headers`  is an [expo-sfv](expo-sfv.md) dictionary. It is defines headers that a client MUST store and include in every subsequent [request](#request).
  
  For example, during a rollout we require a client to send back a stable token: `expo-server-defined-headers: expo-rollout-token="token". 
  * `cache-control` We recommend `cache-control: private, max-age=0`, but the only requirement is that it is a reasonable time frame. Please keep in mind that `updates` should be expected to be regularly created and the cache policy should not block this.

### Manifest

The body of the response MUST be a `manifest`. A `manifest` which is defined as a JSON conforming to the following description:

Let an `Asset` be the JSON:
```
{
  hash: string
  key: string
  contentType: string
  url: string
}
```
then the response body is referred to as the `manifest` and MUST be a json with format:
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
  * `id` The ID MUST uniquely specify the manifest, however the different headers may accompany identical IDs in a response.
  * `createdAt` Time created is essential as the client selects the most recent update (subject to any contraints supplied in the `expo-manifest-filters` header).
  * `runtimeVersion` Can be any string defined by the developer. It stipulates what native code setup is required to run the associated javascript bundle.
  * `Asset` Provides information about the asset and where to obtain it.
    * `hash` SHA256 hash of the file to guarantee integrity.
    * `key` Key used by the bundler.
    * `contentType` e.g. `application/javascript`, `image/jpeg`.
    * `url` Location where the asset is hosted.
  * `launchAsset` The asset that is used to launch the app.
  * `assets` assets used by the app, such as photos or fonts.
  * `updateMetadata` The metadata associated with an update can be used for filtering the update (branchName) and also for the creation of more helpful errors.

### Error

A conformant server MUST return a `400` error if a manifest is not found.

## Server

* can be served on the same server or separate
* rollouts
* branches
* headers


### Cacheing
Both the Manifest and the Asset endpoints MUST be served with a `cache-control` header set to an appropriately short period of time.

For example:
```
cache-control: max-age=0, private
```

### Compression

Assets SHOULD be capable being served with `zip` and `brotli` compression.

### Uploads

The server must upload assets to unique urls that can be computed from the asset. For example, the `sha256` hash of an asset. 

### Branch Mapping
...

The asset server hosts all of the files reference by an update's manifest.


## Client

A client must have a method to check for updates. Some examples are:
   * check on open, block till updated
   * check on open, update in the background
The request for a manifest must include the following headers with a request [headers](protocol/#request)

After fetching a manifest a client must download and store the related assets and store them.

A client must run the most recent update satisfying the 'manifest filters' it has stored. If there is no previously downloaded update, the client must fallback to an `embedded update` that is included in the initial build step.

* must save and send back any headers specified by `serverDefinedHeaders`

See the [reference client](https://github.com/expo/expo/tree/master/packages/expo-updates)

## Index
- [Manifest](manifest.md) 

The standard flow of an update:
  1. Client requests the current manifest
  2. If the manifest is new, the client downloads all of the assets specified by the new manifest.
The protocol begins with a client making a GET request to the manifest server.

The manifest is the metadata for an update that contains information used by the client to determine which update to launch, and how to download all of the assets required to run the update (JS bundle, images, fonts, etc).