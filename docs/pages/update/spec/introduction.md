---
title: EAS Update Spec
sidebar_title: Introduction
---
EAS update is a protocol for managing over the air updates to an app running on multiple platforms. 

The protocol begins with a client making a GET request to the manifest server.

The manifest is the metadata for an update that contains information used by the client to determine which update to launch, and how to download all of the assets required to run the update (JS bundle, images, fonts, etc).


It can be hosted at any http endpoint, and run by any app that  conforms to the standards.

- [Protocol](protocol.md)
- [Manifest Server](manifest-server.md)
- [Asset Server](asset-server.md)
- [Client](client.md) 