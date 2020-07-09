---
title: App Configuration
---

import AppConfigSchemaPropertiesTable from '~/components/plugins/AppConfigSchemaPropertiesTable';
import schema from '~/scripts/schemas/unversioned/app-config-schema.js';

The following is a list of properties that are available for you under the `"expo"` key in `app.json` or `app.config.json`. These properties can be passed to the top level object of `app.config.js` or `app.config.ts`.

For more general information on App Configuration, check out our introductory [guide](/workflow/configuration/).

## Properties

<AppConfigSchemaPropertiesTable schema={schema}/>
