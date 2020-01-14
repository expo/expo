---
title: Planning our app
---

We have installed the Expo toolchain and we have a running "Hello, world!" app. That's all we need to started on our tutorial: building an app for sharing photos with your friends! Of course you can do this already with many apps on your phone, but you can't yet do it with *your own app*. Let's remedy that.

Our app should have the following features:

- **A logo**: show our users our design skills with a beautiful logo.
- **Some instructional text**: we need to tell the users how to use the app.
- **A button to open a photo picker**: a button we can tap to present the user with a form to pick a photo from their photo library.
- **A button to share a selected photo**: once a photo is selected, the user should be able to press a button to share it.
- **An app icon and splash screen**: make the logo part of the app icon that the user will see on their home screen and the splash screen that is shown when the app is launched, before it has loaded.

// mockup that shows what we will do goes here! include splash screen and app icon

## Initialize a new app

Inside your preferred directory for storing your software projects, run `expo init ImageShare` to create a new project for our app that we will call "Image Share". Navigate to the directory and run `expo start` in it, open the project on your device, and open the code in your code editor of choice. 

- If you have any trouble with this, please refer back to the [create a new app page](../../get-started/create-a-new-app/). 
- If your app is up and running, it is time to [continue to the next step](../../tutorial/text/).