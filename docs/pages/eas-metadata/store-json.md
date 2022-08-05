---
title: EAS Metadata store.config.json schema
sidebar_title: store configuration
---

import schema from '~/scripts/schemas/unversioned/eas-metadata.json';
import { Definition } from '~/components/plugins/JsonSchema';


## Apple store config

<Definition schema={schema} path="#/definitions/AppleConfig" />

### Categories

<Definition schema={schema} path="#/definitions/apple/AppleCategory" />

### Localized info settings

<Definition schema={schema} path="#/definitions/apple/AppleInfo" />

### Review settings

<Definition schema={schema} path="#/definitions/apple/AppleReview" />

### Release settings

<Definition schema={schema} path="#/definitions/apple/AppleRelease" />
