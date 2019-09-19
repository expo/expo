---
title: Ejecting from Managed Workflow
---

The [managed workflow](../../introduction/managed-vs-bare/#managed-workflow) has [its limitations](../../introduction/why-not-expo/), and if you find yourself running up against them then you can either attempt to work around the limitations by exploring alternate solutions that will work within the constraints (eg: moving work to a server if no API exists to do it on the client) or you can eject to the [bare workflow](../../introduction/managed-vs-bare/#bare-workflow) and have full access to the underlying native projects.

The process of ejecting is easily reversible so don't worry about experimenting with it. Just commit any changes you want to keep and then follow along with this guide. If you decide you want to abort it, just check out your most recent commit. You can also reverse it in the future by deleting the `ios` and `android` directories.

To eject to the bare workflow, you can run `expo eject` and choose the "Bare" option. You will prompted with several questions and then the native iOS and Android projects will be created.

> Note: We don't recommend the [ExpoKit](../../expokit/overview/) eject option, it is less flexible and we will stop supporting it in the near future.