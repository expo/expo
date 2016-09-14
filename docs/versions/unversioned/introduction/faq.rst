.. _faq:

Frequently Asked Questions
==========================

How much does Exponent Cost?
----------------------------

Exponent is free.

Our plan is to keep it this way indefinitely.

Exponent is also open source, so you don't have to trust us to stick to that plan.

We might eventually charge money for services built on top of Exponent or for some kind of premium level of
support and consulting.


How do you make money if Exponent is free?
------------------------------------------

Right now, we don't make any money. We have a small team that just wants to work on this, and we keep our expenses
low and are mostly self-funded. We can keep working on this project like this for a while as long as there are people
who want to use it.

We think if we can make Exponent good enough, we can eventually help developers make money, and we could take a
cut of that. This could be through helping them collect money from people using their software, or by helping them
place ads in their apps, or other things. We don't really have a clear plan for this yet; our first priority
is just to make Exponent work really well and be as popular as possible.


What is the difference between Exponent and React Native?
---------------------------------------------------------

Exponent is kind of like Rails for React Native. Lots of things are setup for you, and so its quicker to get started
and on the right path.

With Exponent, you don't need Xcode or Android Studio. You just write JavaScript using whatever text editor you are
comfortable with (Atom, vim, emacs, Sublime, VS Code, whatever you like). You can run XDE (our desktop software) on
Mac, Windows, and Linux.

Here are some of the things Exponent gives you out of the box that work right away:

* **Support for iOS and Android**

  You can use apps written in Exponent on both iOS and Android right out of the box. You don't need to go through
  a separate build process for each one. Just open any Exponent app in the Exponent Developer app from the App Store
  on either iOS or Android (or in a simulator or emulator on your computer).

* **Push Notifications**

  Push notifications work right out of the box across both iOS and Android, using a single, unified API. You don't
  have to setup APNS and GCM/FCM or configure ZeroPush or anything like that. We think we've made this as easy as it
  can be right now

* **Facebook Login**

  This can take a long time to get setup properly yourself, but you should be able to get it working in 10 minutes or
  less on Exponent.

* **Instant Updating**

  All Exponent apps can be updated in seconds by just clicking `Publish` in XDE. You don't have to set anything up;
  it just works this way. If you aren't using Exponent, you'd either use Microsoft Code Push or roll your own solution
  for this problem

* **Asset Management**

  Images, videos, fonts, etc. are all distributed dynamically over the Internet with Exponent. This means they work
  with instant updating and can be changed on the fly. The asset management system built-in to Exponent takes care
  of uploading all the assets in your repo to a CDN so they'll load quickly for anyone.

  Without Exponent, the normal thing to do is to bundle your assets into your app which means you can't change them.
  Or you'd have to manage putting your assets on a CDN or similar yourself.

* **Easier Updating To New React Native Releases**

  We do new releases of Exponent every few weeks. You can stay on an old version of React Native if you like, or
  upgrade to a new one, without worrying about rebuilding your app binary. You can worry about upgrading the
  JavaScript on your own time.

**But no native modules...**

The most limiting thing about Exponent is that you can't add in your own native modules. We give you most of the
most commonly desired things, but if you need something very custom--like on-the-fly video processing or low level
control over the Bluetooth radio to do a firmware update--then Exponent won't work for you and you should just use
regular React Native.

You can do more in just JavaScript than you realize--and in fact, we recommend doing as much in JS as possible, since
it will immediately work across both platforms and is less fragile--so you shouldn't need to include UI widgets
that are written as native modules (there are almost always good pure JavaScript alternatives that are better).

But there are often things that come up that you can't do in Exponent and you just need to use React Native if you want
to do those things. Tell us about what's missing, and we'll try to add what you need if we think there are other people
who would use it too. (Tweet @ us or join our Slack or e-mail support@getexponent.com).


Can I use Exponent with Relay?
------------------------------

You can! Update your ``.babelrc`` you get on a new Exponent project to the following:

.. code-block:: json

  {
    "presets": [
      "react-native-stage-0/decorator-support",
      {"plugins": ["./pathToYourBabelRelayPlugin/babelRelayPlugin"]}
    ],
    "env": {
      "development": {
        "plugins": ["transform-react-jsx-source"]
      }
    }
  };

Substitute ``./pathToYourBabelRelayPlugin`` with the path to your Relay plugin.


How do I get my existing React Native project running with Exponent?
--------------------------------------------------------------------

Install the command line tool `exp` with `npm install exp@next -g`, then `cd`
into your project directory and run `exp convert` and we will do anything
that we can do automatically for you and provide followup instructions for
steps you will have to perform manually. If you have similar native module
dependencies to what is exposed through the Exponent SDK, it shouldn't
take more than a few minutes (not including `npm install` time).
