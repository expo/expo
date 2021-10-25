# Using GitHub Actions with EAS Update

A GitHub Action is a cloud function that runs every time an event on GitHub occurs. We can use GitHub Actions to automate building and publishing updates when you or members on your team merge to a branch, like "production". This makes the process of deploying consistent and fast, leaving you more time to develop your app.

## Publishing when merging to "production"

We can configure GitHub Actions to run on any GitHub event. One of the most common use cases is to publish an app when code is merged to the "production" branch. Below are the steps to publish your app every time a commit is merged to "production":

1. Create a file path named **.github/workflows/update.yml** at the root of your project.
2. Inside **update.yml**, copy and paste this code:

   ```yaml
   name: update
   on:
     push:
       branches: [production]

   jobs:
     update:
       name: EAS Update
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v1
           with:
             node-version: 16.x
         - uses: expo/expo-github-action@v6
           with:
             expo-version: latest
             eas-version: latest
             token: ${{ secrets.EXPO_TOKEN }}
             expo-cache: true
             eas-cache: true
         - name: Find cache
           id: yarn-cache-dir-path
           run: echo "::set-output name=dir::$(yarn cache dir)"
         - name: Restore cache
           uses: actions/cache@v2
           with:
             path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
             key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
             restore-keys: |
               ${{ runner.os }}-yarn-
         - run: yarn install
         - run: eas branch:publish $(echo ${{ github.ref }} | sed 's|refs/heads/||') --message "${{ github.event.head_commit.message }}"
   ```

   In the code above, we set the action to run every time code is pushed to the "production" branch. In the `update` job, we set up Node, in addition to Expo's GitHub Action: `expo-github-action`. We then add a couple steps to cache any dependencies installed from the last run to speed this script up on subsequent runs. At the end, we install dependencies (`yarn install`), then create a branch on EAS, then publish the branch. The EAS branch will be named after the GitHub branch, and the message for the update will match the commit's message.

3. Finally, we need to give the script above permission to run by providing an `EXPO_TOKEN` environment variable.
   1. Navigate to [https://expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
   2. Click "Create" to create a new access token.
   3. Copy the token generated.
   4. Navigate to https://github.com/your-username/your-repo-name/settings/secrets/actions, replacing "your-username" and "your-repo-name" with your project's info.
   5. Click "New repository secret"
   6. Make the secret's name "EXPO_TOKEN", then paste the access token in as the value.

Your GitHub Action should be set up now. Every time when someone merges code into the "production" branch, this action will build an update and publish it, making it available to all of our users with builds that have access to the "production" branch on EAS.

> Some repositories or organizations might need to explicitly enable GitHub Workflows and allow third-party Actions.
