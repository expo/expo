---
title: Client
sidebar_title: Client
---

A client must have a method to check for updates. Some examples are:
   * check on open, block till updated
   * check on open, update in the background
The request for a manifest must include the following headers with a request [headers](protocol/#request)

After fetching a manifest a client must download and store the related assets and store them.

A client must run the most recent update satisfying the 'manifest filters' it has stored. If there is no previously downloaded update, the client must fallback to an `embedded update` that is included in the initial build step.

* must save and send back any headers specified by `serverDefinedHeaders`

See the [reference client](https://github.com/expo/expo/tree/master/packages/expo-updates)