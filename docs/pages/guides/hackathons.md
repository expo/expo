---
title: Hackathons with Expo
sidebar_title: Hackathons with Expo
---

Hackathons are events in which participants work alone or in groups to create a project -- generally some software -- in a short period of time, like a weekend. Hackathons are a really fun and exciting way to learn about new technologies or to just make that thing you’ve been thinking about for weeks. Because hackathons generally require you to move quickly and share your work Expo is a great fit! Here is a short guide on how to make the most of your next hackathon using Expo.

## Scope small to start

The vast majority of the time you won’t be able to get to everything you had planned. The most effective way to deal with this is to _start small_. Define what you’d like to get out of the hackathon and work towards that.

Designers might just want to wireframe and implement some cool UI 😎. In this case, one could prioritize the visual aspects of the app and just mock the functionality. Conversely, developers might want to write the functionality but not worry about how everything looks. They might just use some component libraries instead of styling the elements themselves. In general, if you don’t have a specific look in mind, check out our list of [component libraries](https://docs.expo.io/guides/userinterface/) -- they can help to quickly get a nice looking app without much effort.

If you have no previous experience with a certain feature, see if you can create the app without it. For example, if your goal is to experiment with the [Camera](https://docs.expo.io/versions/latest/sdk/camera) API and you don’t have experience with navigation, see if you can get away with having the entire app be a single screen. You can always pull in the navigation later once your core functionality is complete.

Although, if you do end up needing routing & navigation, check out [react navigation](https://docs.expo.io/guides/routing-and-navigation/) 👏

Finally, having a small scope is relative to the individual. If you're a developer with years of experience it's probably fine to set your initial scope a bit larger than someone who is just starting out. Leaving some breathing room for bugs, unexpected delays, and learning is a great idea for all skill levels.

## Iterate

Now that you’ve narrowed the scope of your app you’ll have time to iterate on your work 🥳. Iterating is great because it allows you to identify problems and areas of improvement that you couldn’t spot beforehand and improve them.

Generally at this stage you’d like to be feature complete. If you’re making an app that [creates memes or lists every pokemon](https://github.com/expo/hackathon-examples) you’ll have that functionality finished. If this is the case, that’s fantastic! If you’re not quite there yet, keep at it! See if you can be feature complete before the start of the final day, assuming your hackathon is longer than a day.

Once you are feature complete, you’ll want to focus on usability. This is when you get to really make your app shine. Usability generally refers to the effectiveness and ease of use of a tool, in this case your app. It’s especially helpful to get feedback from people who aren’t familiar with your app, but all feedback is valuable. Some questions you should be answering at this point are:

- Is it clear to users what my app does?
- Does my UI behave how the user expects it to?
- Does my app clearly communicate its state to the user?
- Are there any bugs or edge-cases that need handling?

This is also a great time to add in sleek [animations](https://docs.expo.io/versions/latest/sdk/reanimated/) or [accessibility](https://reactnative.dev/docs/accessibility?redirected).

Once you’ve done some work on polishing your core functionality it’s a good time to reassess your trajectory. If you have plenty of time left and are feeling ambitious, feel free to bring in another feature!

## Build early and often

You’ll generally need to share your app at the end of the hackathon. Lots of folks get into trouble because they save it for the last minute, then something breaks during the build process. While Expo helps tremendously in simplifying this process, unexpected issues can still arise. We recommend testing your app in both [development and production](https://docs.expo.io/workflow/development-mode/) environments and [building standalone bundles](https://docs.expo.io/distribution/building-standalone-apps/) throughout the event. Having a bundle available for sharing can also help you receive feedback from friends and other hackathon participants. [Snacks](https://docs.expo.io/workflow/snack/) can also be a great way to share out code and collaborate with others. They are also very good when starting out a hackathon because they can be easily shared and eventually downloaded as expo projects to your local machine. 🚀

## Prep ahead of time

It can be tough to learn a new tool and still produce the app in your head on such a short timeframe. It can be useful to do some of the work ahead of time so you can focus on making the app rather than learning the tool. For example, if you’ve never used React-Native or Expo before it might be worth following the [tutorial](https://docs.expo.io/tutorial/planning/) earlier in the week. It should not take much time and it will save you time during the hackathon.

Choosing your technologies ahead of time can help you in your prep for the event. By knowing what technologies you’ll be using you can identify any gaps in your knowledge. It can also help you identify ways to cut down in scope. For example, using local storage like [sqlite](https://docs.expo.io/versions/latest/sdk/sqlite/) or [async-storage](https://docs.expo.io/versions/latest/sdk/async-storage/) rather than server side storage for persistent data can be a great time saver when building out a user’s profile & preferences.

## Have fun

Hackathons are great for learning new skills or testing assumptions, but they should also be enjoyable experiences. Be sure to take frequent breaks when needed -- think of it as a marathon, not a sprint. Also, working in a group is great. You’ll get more done and it will be fun to collaborate with other developers 🤝. You may end up with a fantastic result you didn’t expect due to the different collaborators interests and skill-sets.
