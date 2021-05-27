# Updating Changelogs

- [Changelog entries](#changelog-entries)
- [Categories](#categories)
- [Tools](#tools)

A changelog is a file which contains a curated, chronologically ordered list of notable changes for each version of a package.
The main purpose of changelogs (in general) is to inform users and contributors about changes that have been made in subsequent versions. However, in [`expo/expo`](https://github.com/expo/expo) repository, they have one more purpose — to help us decide how to bump the package version when we publish it (see [categories'](#categories) descriptions for more).

Most of the packages inside [`packages`](https://github.com/expo/expo/tree/master/packages) directory have their own changelogs, that should get updated on every change we made in the package.

## Changelog entries

Each bullet point in the changelog is called an entry. It describes the change that has been introduced in the package. Here is what defines a good changelog entry:

- It is descriptive and concise — explains well the change to a reader who has _zero context_ about the change. If you have trouble making it both concise and descriptive, err on the side of descriptive.
- It is placed under `Unpublished` version and the appropriate category ([follow rules described here](#categories)).
- It has links to PR's author and PR itself (`expo-ci` bot can suggest them for you, read more below in this section).
- It may contain only text and links. Any other markdown elements (such as lists, headers, blockquotes, tables, images, inline HTML) are not permitted — if you need them to provide important tips for the users to adapt to the (breaking) change, you should put this in the PR's description or link to a separate document on [`expo/fyi`](https://github.com/expo/fyi).

An example of the correct entry:

> \- Added a guide about updating changelogs in the packages. ([#13075](https://github.com/expo/expo/pull/13075) by [@tsapeta](https://github.com/tsapeta))

We would like each entry to contain links to the PR and author's profile, so that everyone can find out more details about that change by opening the PR's page or, as a last resort, contact the author.
Moreover, when the package is about to be published, our automated script runs through these PRs to find closed issues and then comments on such issues to let subscribed users know that the fix is available to the public (usually as `next` tag on NPM).
At first it might sound annoying to create the PR first (to get PR's number), update changelog and then push once again. However, in thanks to our code reviewing bot, you can skip the links at the end — it'll post code review suggestions to add them.

## Categories

We're sticking with a few types of changes which are grouped together within the category (Markdown section with a third-level heading). It's important to put the entries under correct category - the categories are also used in the publish script to help decide how to bump the package version. Here is a list of predefined categories used across all changelogs in the repository 👇

- **🛠 Breaking changes**

  For changes in the API that may require users to change their code or project settings. Implies **major** bump when publishing the package.

- **🎉 New features**

  For new features and non-breaking changes in the API. Implies at least **minor** bump when publishing the package.

- **🐛 Bug fixes**

  For bug fixes and changes to the documentation that clarify any ambiguities.

- **⚠️ Notices**

  For changes that don't fit into the above sections, but users should be aware of as they deprecate existing API while still keeping backwards compatibility or cause behavior changes in some corner cases.

- **💡 Others**

  Anything that doesn't apply to the other types. Such changes are usually not very important for the users, but might come in handy for other contributors (e.g. refactors, build tools or language version updates, some routine work).

- **📚 3rd party library updates**

  Use it when you upgraded 3rd-party library (such as `react-native-reanimated`, `react-native-webview`) in Expo Go (used only in root's changelog).

## Tools

- `et add-changelog`

  Lets you automate adding a changelog entry to the package. Run `et add-changelog --help` for more details.

- `et merge-changelogs`

  This command is intented to be used by people doing a SDK release — it merges changelog entries from all SDK packages as of the previous SDK version and puts them into the root's [`CHANGELOG.md`](https://github.com/expo/expo/blob/master/CHANGELOG.md).
