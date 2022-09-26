---
title: app.json / app.config.js
maxHeadingDepth: 5
---

{/*
Hi! If you found an issue within the description of the manifest properties, please create a GitHub issue.
*/}

import AppConfigSchemaPropertiesTable from '~/components/plugins/AppConfigSchemaPropertiesTable';
import schema from '~/scripts/schemas/v46.0.0/app-config-schema.js';

The following is a list of properties that are available for you under the `"expo"` key in **app.json** or **app.config.json**. These properties can be passed to the top level object of **app.config.js** or **app.config.ts**.

For more general information on app configuration, such as the differences between the various app configuration files, check out our introductory [guide](/workflow/configuration/).

## Properties

<AppConfigSchemaPropertiesTable schema={schema} />
