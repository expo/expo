---
title: Using GitHub Actions
---

A GitHub Action is a cloud function that runs every time an event on GitHub occurs. We can use GitHub Actions to automate building and publishing updates when you or members on your team merge to a branch, like "production". This makes the process of deploying consistent and fast, leaving you more time to develop your app.

## Publish updates on push

We can configure GitHub Actions to run on any GitHub event. One of the most common use cases is to publish an update when code is pushed. Below are the steps to publish an update every time an update is pushed:

1. Create a file path named `.github/workflows/update.yml` at the root of your project.
2. Inside `update.yml`, copy and paste this code:

   ```yaml
   name: update
   on: push

   jobs:
     update:
       name: EAS Update
       runs-on: ubuntu-latest
       steps:
         - name: Check for EXPO_TOKEN
           run: |
             if [ -z "${{ secrets.EXPO_TOKEN }}" ]; then
               echo "You must provide an EXPO_TOKEN secret linked to this project's Expo account in this repo's secrets. Learn more: https://docs.expo.dev/eas-update/github-actions"
               exit 1
             fi

         - name: Checkout repository
           uses: actions/checkout@v2

         - name: Setup Node
           uses: actions/setup-node@v2
           with:
             node-version: 16.x
             cache: yarn

         - name: Setup Expo
           uses: expo/expo-github-action@v7
           with:
             expo-version: latest
             eas-version: latest
             token: ${{ secrets.EXPO_TOKEN }}

         - name: Find yarn cache
           id: yarn-cache-path
           run: echo "::set-output name=dir::$(yarn cache dir)"

         - name: Restore cache
           uses: actions/cache@v2
           with:
             path: ${{ steps.yarn-cache-path.outputs.dir }}
             key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
             restore-keys: ${{ runner.os }}-yarn-

         - name: Install dependencies
           run: yarn install --immutable

         - name: Publish update
           run: eas update --auto
   ```

   In the code above, we set the action to run every time code is pushed to any branch. In the `update` job, we set up Node, in addition to Expo's GitHub Action: `expo-github-action`. We then add a couple steps to cache any dependencies installed from the last run to speed this script up on subsequent runs. At the end, we install dependencies (`yarn install`), then publish the update with `eas update --auto`. Since we're using the `--auto` flag, the EAS branch will be named after the GitHub branch, and the message for the update will match the commit's message.

3. Finally, we need to give the script above permission to run by providing an `EXPO_TOKEN` environment variable.
   1. Navigate to [https://expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
   2. Click "Create" to create a new access token.
   3. Copy the token generated.
   4. Navigate to https://github.com/your-username/your-repo-name/settings/secrets/actions, replacing "your-username" and "your-repo-name" with your project's info.
   5. Click "New repository secret"
   6. Make the secret's name "EXPO_TOKEN", then paste the access token in as the value.

Your GitHub Action should be set up now. Every time when a developer merges code into the repo, this action will build an update and publish it, making it available to all of our devices with builds that have access to the EAS branch.

> Some repositories or organizations might need to explicitly enable GitHub Workflows and allow third-party Actions.
