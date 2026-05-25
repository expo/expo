---
title: Collapsible
description: A labelled tappable header that toggles visibility of its content.
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-ui'
packageName: '@expo/ui'
platforms: ['android', 'ios', 'web', 'expo-go']
---

import APISection from '~/components/plugins/APISection';
import { APIInstallSection } from '~/components/plugins/InstallSection';

`Collapsible` is a primitive that shows or hides its content with a tap on a labelled header. Controlled via [`isOpen`](#isopen) and [`onOpenChange`](#onopenchange) — each `Collapsible` manages independent state.

## Installation

<APIInstallSection />

## Usage

### Basic collapsible

```tsx CollapsibleExample.tsx
import { useState } from 'react';
import { Host, Column, Collapsible, Text } from '@expo/ui';

export default function CollapsibleExample() {
  const [open, setOpen] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <Column spacing={8} style={{ padding: 16 }}>
        <Collapsible isOpen={open} onOpenChange={setOpen} label="About">
          <Text>
            A primitive that toggles visibility of its content via a labelled tappable header.
          </Text>
        </Collapsible>
      </Column>
    </Host>
  );
}
```

### Accordion (one section open at a time)

Wire each `Collapsible`'s `isOpen` to a shared parent value. The component doesn't enforce exclusivity — composition is up to the consumer.

```tsx CollapsibleAccordionExample.tsx
import { useState } from 'react';
import { Host, Column, Collapsible, Text } from '@expo/ui';

type Section = 'a' | 'b' | 'c' | null;

export default function CollapsibleAccordionExample() {
  const [openSection, setOpenSection] = useState<Section>('a');

  return (
    <Host style={{ flex: 1 }}>
      <Column spacing={8} style={{ padding: 16 }}>
        <Collapsible
          isOpen={openSection === 'a'}
          onOpenChange={open => setOpenSection(open ? 'a' : null)}
          label="Section A">
          <Text>Opening B or C closes this one.</Text>
        </Collapsible>
        <Collapsible
          isOpen={openSection === 'b'}
          onOpenChange={open => setOpenSection(open ? 'b' : null)}
          label="Section B">
          <Text>Opening A or C closes this one.</Text>
        </Collapsible>
        <Collapsible
          isOpen={openSection === 'c'}
          onOpenChange={open => setOpenSection(open ? 'c' : null)}
          label="Section C">
          <Text>Opening A or B closes this one.</Text>
        </Collapsible>
      </Column>
    </Host>
  );
}
```

## API

```tsx
import { Collapsible } from '@expo/ui';
```

<APISection packageName="expo-ui/universal/collapsible" apiName="Collapsible" />
