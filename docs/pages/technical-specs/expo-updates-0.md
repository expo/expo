---
title: Expo Updates
sidebar_title: Expo Updates
---

version 0

---

## Introduction

This is the specification for Expo Updates, a protocol for delivering updates to Expo apps running on multiple platforms.

### Conformance

Conforming servers and client libraries must fulfill all normative requirements. Conformance requirements are described in this document by both descriptive assertions and key words with clearly defined meanings.

The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in the normative portions of this document are to be interpreted as described in [IETF RFC 2119](https://tools.ietf.org/html/rfc2119). These key words may appear in lowercase and still retain their meaning unless explicitly declared as non‐normative.

A conforming implementation of this protocol may provide additional functionality, but must not where explicitly disallowed or would otherwise result in non‐conformance.

### Overview

Conforming servers and client libraries MUST follow the HTTP spec as described in [RFC 7231](https://tools.ietf.org/html/rfc7231) as well as the more precise guidance described in this spec.

An _update_ is defined as a [_manifest_](#manifest-response) together with the assets referenced inside the manifest.
Expo Updates is a protocol for assembling and delivering updates to apps running on multiple platforms.

An app running a conformant Expo Updates client library will fetch the most recent update from a conformant update server. If the client library cannot fetch an update or if it already has the most recent update, the client library will load the update saved in the client library's cache.

The following describes how a client library will interact with a conforming updates server:
1. The client library will make a [request](#request) for the most recent manifest that satisfies constraints specified in the headers. 
2. If it is a new manifest, the client library will proceed to make requests to download and store the assets specified in the manifest.
3. Finally, the client library will update its local state according to any metadata provided by the response [headers](#headers).

The primary consumers of this spec are Expo Application Services and organizations that wish to manage their own update server to satisfy internal requirements.

## Manifest Request
A conformant client library MUST make a GET request with the headers:

1. `expo-platform`, to specify the platform type the client is running on.
    * iOS MUST be `expo-platform: ios`.
    * Android MUST be `expo-platform: android`.
    * If it is not one of these platforms, the server SHOULD return a 400 or a 404
2. `expo-runtime-version` MUST be the runtime version the client is running on.
3. Any headers stipulated by a previous responses' [server defined headers](#headers):

A conformant client library SHOULD also send `accept: application/expo+json, application/json`. With the order following the prefence ordering for the accept header specified in [RFC 7231](https://tools.ietf.org/html/rfc7231#section-5.3.2). But MUST send at least one of them, `accept: application/expo+json` or `accept: application/json`.

Example:
```
accept: application/expo+json, application/json
expo-platform: string
expo-runtime-version: string
```

## Manifest Response

A conformant server MUST return a response containing a [manifest body](#body) and [headers](#headers).

The choice of manifest and headers are dependent on the values of the request headers. A conformant server MUST:

* Return a manifest that describes the most recent update ordered by creation time satisfying all constraints imposed by the [request headers](#manifest-request).

### Headers

```
expo-protocol-version: 0
expo-sfv-version: 0
expo-manifest-filters: <expo-sfv>
expo-server-defined-headers: <expo-sfv>
cache-control: <*>
content-type: <*>
```

* `expo-protocol-version` describes the version of the protocol defined in this spec and MUST be `0`.
* `expo-sfv-version`  MUST be `0`.
* `expo-manifest-filters` is an [Expo SFV 0](expo-sfv-0.md) dictionary. It is used to filter updates stored by the client library by the `metadata` attributes found in the [manifest](#body).
  * For example: `expo-manifest-filters: branchname="main"` instructs the client library to load the most recent update it has stored whose `metadata` contains:

  ```
  metadata: {
    branchName: "main",
    ...
  }
  ```
  * If the `branchname` manifest filter is included, it MUST equal the `branchName` in the `manifest.metadata`.
* `expo-server-defined-headers` is an [Expo SFV](expo-sfv.md) dictionary. It defines headers that a client library MUST store and include in every subsequent [manifest request](#manifest-request).

  * For example, when rolling out an update, we require a client library to send back a stable token: `expo-server-defined-headers: expo-rollout-token="token"`. 
* `cache-control` - A value of `cache-control: private, max-age=0` is recommended to ensure the newest manifest is returned. Setting longer cache ages could result in stale updates.
* `content-type` MUST be determined by _proactive negotiation_ as defined in [RFC 7231](https://tools.ietf.org/html/rfc7231#section-3.4.1). Since we require a client to send an `accept` header with each request, this will always be either `application/expo+json`, `application/json`, or a `406`.


The manifest endpoint MUST also be served with a `cache-control` header set to an appropriately short period of time. For example:

```
cache-control: max-age=0, private
```

### Body

The body of the response MUST be a manifest, which is defined as JSON conforming to the following structure:
```
{
  id: string
  createdAt: datetime
  runtimeVersion: string
  launchAsset: Asset
  assets: Asset[]
  metadata: { [key: string]: number | string }
}
```
_Asset_ is defined as JSON with the following structure:
```
{
  hash: string
  key: string
  contentType: string
  url: string
}
```
  * `id` The ID MUST uniquely specify the manifest.
  * `createdAt` The date and time created is essential as the client library selects the most recent update (subject to any constraints supplied by the `expo-manifest-filters` header). The datetime should be formatted according to [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
  * `runtimeVersion` Can be any string defined by the developer. It stipulates what native code setup is required to run the associated update.
  * `Asset` Provides information about an asset file.
    * `hash` SHA-256 hash of the file to guarantee integrity.
    * `key` Key used to reference this asset from the update's application code. This key, for example, may be generated by a separate build step that processes the application code, such as a bundler.
    * `contentType` The MIME type of the file as defined by [RFC 2045](https://tools.ietf.org/html/rfc2045). e.g. `application/javascript`, `image/jpeg`.
    * `url` Location from which the file may be fetched.
  * `launchAsset` The asset that is used to launch the app.
  * `assets` An array of assets used by the update bundle, such as JavaScript, pictures, and fonts.
  * `metadata` The metadata associated with an update. This can be used for filtering the update (see the `branchname` example above) and also for the creation of more helpful errors. In particular, the server MAY send back the string valued `metadata` keys:
    * `branchName` used to sort updates into groups called _branches_.
    * `updateGroup` used to group updates for different platforms that come from the same publish.

## Asset Request
A conformant client library MUST make a GET request to the asset URL specified by the manifest. The client library SHOULD include a header accepting the asset's content type as specified in the manifest. Additionally, the client library SHOULD specify the compression encoding the client library is capable of handling.

Example headers:
```
accept: image/jpeg, */*
accept-encoding: br, gzip
```

## Asset Response

An asset located at a particular URL MUST NOT be changed or removed since client libraries may fetch assets for any update at any time.

### Headers

The asset MUST be encoded using a compression format that the client supports according to the request's `accept-encoding` header. The server MAY serve uncompressed assets. The response MUST include a `content-type` header with the MIME type of the asset.
For example:
```
content-encoding: br
content-type: application/javascript
```

The asset endpoints MUST be served with a `cache-control` header set to an appropriately short period of time. For example:

```
cache-control: max-age=0, private
```

### Compression

Assets SHOULD be capable being served with [Gzip](https://www.gnu.org/software/gzip/) and [Brotli](https://github.com/google/brotli) compression.

## Client Library

See the [reference client library](https://github.com/expo/expo/tree/master/packages/expo-updates)
