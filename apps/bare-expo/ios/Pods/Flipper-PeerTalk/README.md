# peertalk

PeerTalk is an iOS and Mac Cocoa library for communicating over USB.

    
                             ┌──────────────────────────────┐
                             │ ┌──────────────────────────┐ │
                             │ │                          │ │
      ┌─────────┐            │ │                          │ │
      │┌───────┐│            │ │          Hello           │ │
      ││       ││            │ │                          │ │
      ││ Hello ││            │ │                          │ │
      ││       ││            │ │                          │ │
      │└───────┘│            │ └──────────────────────────┘ │
      │    ⃝    │            \  ─────────────────────────── \
      └────╦────┘             \  \ \ \ \ \ \ \ \ \ \ \ \ \ \ \
           ║         ╔══════════■ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \
           ╚═════════╝          \  ─────────────────────────── \
          - meep -               └─────────────────────────────┘
             - beep -
    

#### Highlights

1. Provides you with USB device attach/detach events and attached device's info

2. Can connect to TCP services on supported attached devices (e.g. an iPhone),
   bridging the communication over USB transport

3. Offers a higher-level API (PTChannel and PTProtocol) for convenient
   implementations.

4. Tested and designed for libdispatch (aka Grand Central Dispatch).

Grab the goods from [https://github.com/rsms/peertalk](https://github.com/rsms/peertalk)


### Usage in Apple App Store

PeerTalk has successfully been released on both the iOS and OS X app store.

A great example is [Duet Display](http://www.duetdisplay.com/) which is a fantastic piece of software allowing you to use your iDevice as an extra display for your Mac using the Lightning or 30-pin cable.

Facebook's [Origami](http://facebook.github.io/origami/) uses PeerTalk for it's Origami Live iOS app (in fact, this is where PeerTalk was first used, back in 2012)

This *probably* means that you can use PeerTalk for apps aiming at the App Store.

## Getting started

Suck down the code and open *peertalk.xcodeproj* in Xcode 4.3 or later on OS X 10.7 or later.

1. Select the "peertalk" target and hit Cmd+U (Product → Test) and verify that the unit tests passed.

2. Select the "Peertalk Example" target and hit Cmd+R (Product → Run). You should se a less than-pretty, standard window with some text saying it's ready. That's the OS X example app you're looking at.

3. In Xcode, select the "Peertalk iOS Example" target for the iPhone Simulator, and hit Cmd+R (Product → Run). There should be some action going on now. Try sending some messages between the OS X app and the app running in the iPhone simulator.

3. Connect your iOS device (iPhone, iPod or iPad) and kill the iPhone simulator and go back to Xcode. Select the "Peertalk iOS Example" target for your connected iOS device. Hit Cmd+R (Product → Run) to build and run the sample app on your device.

It _should_ work.

Demo video: [http://www.youtube.com/watch?v=kQPWy8N0mBg](http://www.youtube.com/watch?v=kQPWy8N0mBg)

<iframe width="880" height="530" src="http://www.youtube.com/embed/kQPWy8N0mBg?hd=1&amp;rel=0" frameborder="0" allowfullscreen></iframe>
