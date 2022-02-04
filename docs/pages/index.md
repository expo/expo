---
title: Introduction to Expo
hideTOC: true
---

import TerminalBlock from '~/components/plugins/TerminalBlock';
import { PageLink } from '~/ui/components/Navigation/PageLink';
import { SectionList } from '~/ui/components/Navigation/SectionList';
import { GroupList } from '~/ui/components/Navigation/GroupList';

[Expo](https://expo.dev) is a framework and a platform for universal React applications. It is a set of tools and services built around React Native and native platforms that help you develop, build, deploy, and quickly iterate on iOS, Android, and web apps from the same JavaScript/TypeScript codebase.

## Quick start

If you are already experienced with React and JavaScript tooling and want to dive right in and figure things out as you go, this is the quickest way to get started:

<TerminalBlock cmd={['# Install the command line tools', 'npm install --global expo-cli','', '# Create a new project', 'expo init my-project']} />

<div style={{ margin: '3rem', padding: '1rem 0', backgroundColor: '#F8F8FA' }}>

  <SectionList route={{ type: 'section', name: 'Tutorial' }} isActive>
    <PageLink route={{ type: 'page', name: 'First steps', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Styling text', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Adding an image', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Creating a button', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Picking an image', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Sharing an image', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Handling platform differences', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Configuring an app icon and splash screen', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Learning more', href: '#' }} />
  </SectionList>

  <GroupList route={{ type: 'group', name: 'Fundamentals' }}>
    <PageLink route={{ type: 'page', name: 'Expo CLI', href: '#' }} isActive />
    <PageLink route={{ type: 'page', name: 'Using libraries', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Errors and debuggin', href: '#' }} />
  </GroupList>

  <SectionList route={{ type: 'section', name: 'Get started' }} isActive>
    <PageLink route={{ type: 'page', name: 'Introduction', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Create a new app', href: '#' }} />
    <PageLink route={{ type: 'page', name: 'Errors and debugging', href: '#' }} isActive />
  </SectionList>

  <SectionList route={{ type: 'section', name: 'Get started' }} isActive>
    <GroupList route={{ type: 'group', name: 'Fundamentals' }}>
      <PageLink route={{ type: 'page', name: 'Expo CLI', href: '#' }} isActive />
      <PageLink route={{ type: 'page', name: 'Using libraries', href: '#' }} />
      <PageLink route={{ type: 'page', name: 'Errors and debuggin', href: '#' }} />
    </GroupList>
  </SectionList>

</div>

## Slow start

Follow us through a choose-your-own-adventure learning journey and we'll teach you how to get oriented in the Expo and React Native ecosystems and write your first app.

- ️🛠 **If you are a hands-on, learn-by-doing, practical learner** then you can [continue to the "Installation" guide](get-started/installation.md).
- 📚 **If you prefer to have a theoretical understanding before installing tools and writing code** then the sections in this introduction will help you by explaining in more detail what Expo is. It will help you build a mental model for how to think about app development the Expo way and equip you with the knowledge to know which pieces of Expo are a good fit for your specific needs. [Continue to the "Workflows" page](introduction/managed-vs-bare.md).
