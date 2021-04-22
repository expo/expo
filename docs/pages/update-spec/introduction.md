---
title: Update Spec
sidebar_title: Expo Updates 0
---

version 0

---

## Introduction

This is the specification for Expo Updates, a protocol for delivering updates to apps running on multiple platforms.

### Conformance

Conforming servers and clients must fulfill all normative requirements. Conformance requirements are described in this document by both descriptive assertions and key words with clearly defined meanings.

The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in the normative portions of this document are to be interpreted as described in [IETF RFC 2119](https://tools.ietf.org/html/rfc2119). These key words may appear in lowercase and still retain their meaning unless explicitly declared as non‐normative.

A conforming implementation of this protocol may provide additional functionality, but must not where explicitly disallowed or would otherwise result in non‐conformance.

### Overview

An _update_ is defined as a [_manifest_](#manifest) together with the assets referenced inside the manifest.
Expo Updates is a protocol for delivering updates to apps running on multiple platforms.

An app running a conformant Expo Update client will load the most recent update saved by the client.

In order to obtain an `update`:
1. The client makes a [request](#request). 
2. If the response body is a new manifest (checking the manifest ID is sufficient) it proceeds to download and store the assets referenced by the manifest.
3. The client updates the local state according to any metadata provided by the response [headers](#headers)

We anticipate the primary user of this spec will be organizations who need to manage their own update server to satisfy internal requirements.

## Request

A conformant client MUST make a GET request with the following standard headers:

```
accept: application/expo+json,application/json
expo-platform: string
expo-runtime-version: string
```
Along with any headers stipulated by a previous responses' [server defined headers](#server-defined-headers):

* `expo-platform` MUST be platform type the client is running on: 
    * iOS MUST be `expo-platform: ios`
    * Android MUST be `expo-platform: android`
* `expo-runtime-version` MUST be the runtime version the client is running on.

## Response

A conformant server MUST return a body containing a [manifest](#manifest) along with the [headers](#headers) specified below.

The choice of manifest and headers are dependent on the values of the request headers. A conformant server MUST:

* Return a manifest that describes an `update` capable of running on the platform and runtime version specified in the `expo-platform` and `expo-runtime-version` request headers. 
* Return a `manifest` that describes the most recent, sorted by creation time, `update` satisfying any constraints imposed by the headers.

### Headers

```
expo-protocol-version: 0
expo-sfv-version: 0
expo-manifest-filters: expo-sfv
expo-server-defined-headers: expo-sfv
cache-control: *
content-type: application/json; charset=utf-8
```

* `expo-protocol-version` describes the version of the protocol. MUST be `0`.
* `expo-sfv-version`  EAS Update version 0 MUST set this to `0`.
* `expo-sfv`   [expo SFV 0](expo-sfv-0.md) version `0` is a partial implementation of Structured Field Values outlined in [IETF RFC 8941](https://tools.ietf.org/html/rfc8941)
* `expo-manifest-filters` is an [Expo SFV 0](expo-sfv-0.md) dictionary. It is used to filter updates stored by the client by the `updateMetadata` attributes found in the [manifest](#manifest).
  * For example: `expo-manifest-filters: branchname="main"` instructs the client to load the most recent update it has stored whose `updateMetadata` contains:

  ```
  updateMetadata: {
    branchname: 'main',
    ...
  }
  ```
  * If the `branchname` manifest filter is included, it MUST equal the `branchName` in the `manifest.updateMetadata`.
* `expo-server-defined-headers` is an [Expo SFV](expo-sfv.md) dictionary. It defines headers that a client MUST store and include in every subsequent [request](#request).

  * For example, when rolling out an update, we require a client to send back a stable token: `expo-server-defined-headers: expo-rollout-token="token"`. 
* `cache-control` We recommend `cache-control: private, max-age=0`, but the only requirement is that it is a reasonable time frame. Please keep in mind that `updates` should be expected to be regularly created and the cache policy should not block this.

### Manifest

The body of the response MUST be a `manifest`. A `manifest` is defined as JSON conforming to the following description:

The response body is referred to as the `manifest` and MUST be a JSON with format:
```
{
  id: string
  createdAt: date
  runtimeVersion: string
  launchAsset: Asset
  assets: Asset[]
  updateMetadata: { [key: string]: number | string }
}
```
Where an `Asset` is the JSON:
```
{
  hash: string
  key: string
  contentType: string
  url: string
}
```
  * `id` The ID MUST uniquely specify the manifest, however the different headers may accompany identical IDs in a response.
  * `createdAt` Time created is essential as the client selects the most recent update (subject to any contraints supplied in the `expo-manifest-filters` header).
  * `runtimeVersion` Can be any string defined by the developer. It stipulates what native code setup is required to run the associated JavaScript update bundle.
  * `Asset` Provides information about an asset and where to obtain it.
    * `hash` SHA256 hash of the file to guarantee integrity.
    * `key` Key used by the bundler.
    * `contentType` e.g. `application/javascript`, `image/jpeg`.
    * `url` Location where the asset is hosted.
  * `launchAsset` The asset that is used to launch the app.
  * `assets` An array of assets used by the update bundle, such as JavaScript, pictures, and fonts.
  * `updateMetadata` The metadata associated with an update. This can be used for filtering the update (see the `branchname` example above) and also for the creation of more helpful errors. In particular, the server MAY send back the string valued `updateMetadata` keys:
    * `branchName` used to sort updates into groups called _branches_.
    * `updateGroup` used to group updates for different platforms that come from the same publish.

### Error

A conformant server SHOULD return 
  * a `404` error if a manifest is not found.
  * a `400` if the request is malformed.
  * a `405` if the request is not a GET.
  * a `500` if there is a server error.


## Server

There are two functions for a conformant server:
  * serve the correct [response](#response) for a given [request](#request)
  * host assets referenced in the [manifests](#manifest)

### Caching Policy

Both manifest and asset endpoints MUST be served with a `cache-control` header set to an appropriately short period of time. For example:

```
cache-control: max-age=0, private
```

### Compression

Assets SHOULD be capable being served with [gzip](https://www.gnu.org/software/gzip/) and [brotli](https://github.com/google/brotli) compression.
The asset hosted at a particular URL MUST NOT be changed. Clients with stale updates may still require old assets.

## Client Library

See the [reference client library](https://github.com/expo/expo/tree/master/packages/expo-updates)
