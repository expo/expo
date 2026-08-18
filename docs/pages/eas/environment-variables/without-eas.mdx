---
title: Using environment variables without EAS
sidebar_title: Without EAS
description: Learn about non-EAS ways to manage environment variables in Expo and React Native projects.
---

import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';

import { BoxLink } from '~/ui/components/BoxLink';

Using [EAS Environment Variables](/eas/environment-variables/) is the recommended way to manage environment variables for cloud builds and updates, but you can still work locally or with other tooling.

## Managing environment variables without EAS

If you want to manage environment variables without EAS, you can use tools like [`dotenv`](https://www.npmjs.com/package/dotenv) (Node-based loaders) or services such as [Doppler](https://www.doppler.com/) that inject environment variables. These utilities allow you to create a **.env** file in which you can store your environment variables.

> **Note:** Avoid committing secrets to **.env** files if you are managing your environment variables without EAS.

## How environment variables are loaded

After creating the **.env** file, you need to ensure that the file is not listed inside your **.gitignore** or **.easignore** files. Then it can be picked up by EAS commands like `eas build`, `eas update`, and so on.

The **.env** files load according to the [standard **.env** file](https://github.com/bkeepers/dotenv/blob/c6e583a/README.md#what-other-env-files-can-i-use) resolution and then replaces all references in your code to `process.env.EXPO_PUBLIC_[VARIABLE_NAME]` with the corresponding value set in the **.env** files. Code inside **node_modules** directory is not affected for security purposes.

<BoxLink
  title="Reading environment variables from .env files"
  description="For more information, see how to read environment variables from .env files in Expo CLI."
  href="/guides/environment-variables/#reading-environment-variables-from-env-files"
  Icon={BookOpen02Icon}
/>

## Using .env files with EAS Hosting

When using **.env** files with EAS Hosting, environment variables prefixed with `EXPO_PUBLIC_` are all available in the client-side code and the server-side code. The variables not prefixed with `EXPO_PUBLIC_` are only available in the server-side code.

The [steps for including client-side and server-side environment variables](/eas/environment-variables/usage/#storing-environment-variables) are the same as when using EAS environment variables. So you need to ensure that your local **.env** files include the correct environment variables before running the `npx expo export` command.
