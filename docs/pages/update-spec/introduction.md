---
title: Technical Spec
sidebar_title: Introduction
---
## Introduction

This is the specification for EAS Update, a protocol for managing over the air updates to apps running on multiple platforms.

### Conformance

Conforming servers and clients must fulfill all normative requirements. Conformance requirements are described in this document via both descriptive assertions and key words with clearly defined meanings.

The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in the normative portions of this document are to be interpreted as described in [IETF RFC 2119](https://tools.ietf.org/html/rfc2119). These key words may appear in lowercase and still retain their meaning unless explicitly declared as non‐normative.

A conforming implementation of may provide additional functionality, but must not where explicitly disallowed or would otherwise result in non‐conformance.

### Overview

EAS Update is a protocol for managing over the air updates to an app running on multiple platforms. 

*Definition:* An `update` is a [manifest](manifest.md) together with its associated [assets](asset.md).

An app running a conformant EAS Update client will load the most recent update saved by the client.
The client will also systematically fetch new updates from a conformant EAS Update server.

*EAS Update design principles:*
  1. Fast Iteration speed
  2. Universality

We anticipate the primary user of this spec will be companies wishing to manage their own update server to satisfy internal requirements.

## Request
A conformant client MUST make a GET request with the following standard headers along with anything dictated by the [server defined headers](#server-defined-headers):
### Standard Headers
```
accept: "application/expo+json,application/json"
expo-platform: string
expo-runtimeVersion: string
expo-channel-name: string
expo-accept-signature: boolean
```
### Server Defined Headers
Along with any headers dictated by a previous responses `expo-server-defined-headers`. 

## Response
### Data

A conformant server must return 

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
**_Header Details_**
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
**Body Details**
  * `id` The ID must uniquely specify the manifest, however the different headers may accompany identical IDs in a response.
  * `createdAt` Time created is essential as the client selects the most recent update (subject to any contraints supplied in the `expo-manifest-filters` header).
  * `runtimeVersion` Can be any string defined by the developer. It stipulates what native code setup is required to run the associated javascript bundle.
  * `Asset` Provides information about the asset.
    * `hash` SHA256 hash of the file to guarantee integrity.
    * `key` Key used by the bundler.
    * `contentType` e.g. `application/javascript`, `image/jpeg`.
    * `url` Location where the asset is hosted.
  * `launchAsset` The asset that should be used to launch the app.
  * `assets` Assets used by the app, such as photos or fonts.
  * `updateMetadata` The meta data associated with an update can be used for filtering the update (branchName) and also for the creation of more helpful errors.
### Error

A conformant server must return a `400` error if a manifest is not found

* can be served on the same server or separate
* rollouts
* branches
* headers


## Server

### Cacheing

Assets must be served with a `cache-control` header set to an appropriately short period of time.

For example:
```
cache-control: max-age=0, private
```

### Branch Mapping
...

The asset server hosts all of the files reference by an update's manifest.

### Compression

Assets should be capable being served with `zip` and `brotli` compression.

### Cacheing

Assets must be served with a `cache-control` header set to an appropriately short period of time.

For example:
```
cache-control: max-age=0, private
```

### Uploads

The server must upload assets to unique urls that can be computed from the asset. For example, the `sha256` hash of an asset. 


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