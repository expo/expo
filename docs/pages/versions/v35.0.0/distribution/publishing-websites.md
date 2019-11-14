---
title: Publishing Websites
---

## Table of contents

- [AWS Amplify Console](#aws-amplify-console)
- [Now](#now)
- [Surge](#surge)
- [Netlify](#netlify)
  - [Manual deployment with the Netlify CDN](#manual-deployment-with-the-netlify-cdn)
  - [Continuous delivery](#continuous-delivery)
- [GitHub Pages](#github-pages)

## [AWS Amplify Console](https://console.amplify.aws)

The AWS Amplify Console provides a Git-based workflow for continuously deploying and hosting full-stack serverless web apps. Amplify deploys your PWA from a repository instead of from your computer. In this guide, we'll use a GitHub repository. Before starting, [create a new repo on GitHub](https://github.com/new).

1. Add the [amplify.yml](https://github.com/expo/amplify-demo/blob/master/amplify.yml) file to the root of your repo.

2. Push your local Expo project to your GitHub repository. If you haven't pushed to GitHub yet, follow [GitHub's guide to add an existing project to GitHub](https://help.github.com/en/articles/adding-an-existing-project-to-github-using-the-command-line).

3. Login to the [Amplify Console](https://console.aws.amazon.com/amplify/home) and choose **Get started** under **Deploy**. Grant Amplify permission to read from your GitHub account or organization that owns your repo.

4. The Amplify Console will detect that the `amplify.yml` file is in your repo. Choose **Next**.

5. Review your settings and choose **Save and deploy**. Your app will now be deployed to a `https://branchname.xxxxxx.amplifyapp.com` URL.

## [Now](https://zeit.co/now)

Now has a single-command zero-config deployment flow. You can use `now` to deploy your app for free! 💯

> For more information on unlimited hosting, check out [the blog post](https://zeit.co/blog/unlimited-static).

1. Install the now CLI with `npm install -g now`.

2. Build your Expo web app with `expo build:web`.

3. To deploy:

- Run `cd web-build`
- Run `now --name your-project-name`
- You should see a **`now.sh`** URL in your output like: `> Ready! https://expo-web-is-cool-nocabnave.now.sh (copied!)`

Paste that URL into your browser when the build is complete, and you will see your deployed app!

## [Surge](https://surge.sh/)

Install the Surge CLI if you haven’t already by running `npm install -g surge`.
Run the `surge` command, then promptly log in or create a new account.

When asked about the project path, make sure to specify the `web-build` folder, for example:

```sh
project path: /path/to/expo-project/web-build
```

> To support routers that use the HTML 5 `pushState` API, you'll need to rename the `web-build/index.html` to `web/200.html` before deploying.

## [Netlify](https://www.netlify.com/)

### Manual deployment with the Netlify CDN

```sh
npm install netlify-cli -g
netlify deploy
```

Choose `web-build` as the path to deploy.

### Continuous delivery

With this setup Netlify will build and deploy when you push to git or open a new pull request:

1. [Start a new Netlify project](https://app.netlify.com/signup)
2. Pick your Git hosting service and select your repository
3. Click `Build your site`

## [GitHub Pages](https://pages.github.com/)

> We'll use `yarn` but you can use `npm` if you want.

Before starting, be sure to [create a new repo on GitHub](https://github.com/new)

**TL;DR:**

Run the following in your root dir:

```sh
git init
git remote add origin <YOUR_GITHUB_PAGES_URL>
yarn add -D gh-pages
```

Add the following to your `package.json`:

```js
/* package.json */
{
    "homepage": "http://evanbacon.github.io/expo-gh-pages",
    "scripts": {
        "deploy": "gh-pages -d web-build",
        "predeploy": "expo build:web"
    }
}
```

Finally deploy with:

```sh
yarn deploy
```

---

Here are the formal instructions for deploying to GitHub Pages:

1. **Initialize a git repo**

- This is probably already done, but if not then you'll want to run `git init` and set the remote.

  ```
  $ git init
  Initialized empty Git repository in /path/to/expo-gh-pages/.git/
  ```

2. **Add the GitHub repository as a "remote" in your local git repository**

   ```
   $ git remote add origin https://github.com/evanbacon/expo-gh-pages.git
   ```

   - This will make it so the `gh-pages` package knows where you want it to deploy your app.
   - It will also make it so git knows where you want it to push your source code (i.e. the commits on your `master` branch).

3. **Install the `gh-pages` package as a "dev-dependency" of the app**

   ```sh
   yarn add -D gh-pages
   ```

4. **Configure your `package.json` for web hosting**

   - At the top level, add a `homepage` property. Set it's value to the string `http://{username on github, without the curly brackets}.github.io/{repo-name}`. For example: If my GitHub name is `evanbacon` and my GitHub repository is `expo-gh-pages`, I'll asign the following:

   ```js
   /* ... */
   "homepage": "http://evanbacon.github.io/expo-gh-pages"
   // only add this for Github Pages deployment builds, NOT for other methods of deplyoment
   ```

   - In the existing `scripts` property, add a `predeploy` property and a `deploy` property, each having the values shown below:

   ```js
   "scripts": {
     /* ... */
     "deploy": "gh-pages -d web-build",
     "predeploy": "expo build:web"
   }
   ```

   > `predeploy` is automatically run before `deploy`.

5. **Generate a _production build_ of your app, and deploy it to GitHub Pages.** (2 minutes)

   ```
   $ yarn deploy
   ```

   - !! Your app is now available at the URL you set as `homepage` in your `package.json` (call your parents and show them! 😜)

   > When you publish code to `gh-pages`, it will create and push the code to a branch in your repo called `gh-pages`. This branch will have your built code but not your development source code.
