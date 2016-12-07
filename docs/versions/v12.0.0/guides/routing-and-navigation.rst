.. _routing-and-navigation:

********************
Routing & Navigation
********************

A "single page app" on the web is not an app with a single screen, that would
indeed be useless most of the time; rather, it is an app that does not ask the
browser to navigate to a new URL for each new screen. Instead, a "single page
app" will use its own routing subsystem (eg: react-router) that decouples the
screens that are being displayed from the URL bar. Often it will also update
the URL bar too, but override the mechanism that will cause the browser to
reload the page entirely. The purpose of this is for the experience to be
smooth and "app-like".

This same concept applies to with native mobile apps. When you navigate to a
new screen, rather than refreshing the entire app and starting fresh from that
screen, the screen is pushed onto a navigation stack and animated into view
according to its configuration.

The library that we recommend to use for routing & navigation in Exponent
is `ExNavigation <https://github.com/exponentjs/ex-navigation>`_. You can see
the `full documentation for ExNavigation on Github. <https://github.com/exponentjs/ex-navigation>`_.

Try it out
^^^^^^^^^^

The best way to become familiar with what ExNavigation is capable of is to try out
the `ExNavigation example Exponent app
<https://getexponent.com/@community/ex-navigation-example>`_. Once you've had a
chance to try that, come back here and read on!

An introduction: the most bare-bones navigation configuration
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

You can follow along by copying all of the following code into ``main.js`` on a
brand new blank Exponent project, and running ``npm install @exponent/ex-navigation --save``.

.. code-block:: javascript

  import Exponent from 'exponent';
  import React from 'react';
  import {
    AppRegistry,
    Text,
    View,
  } from 'react-native';

  import {
    createRouter,
    NavigationProvider,
    StackNavigation,
  } from '@exponent/ex-navigation';

  const Router = createRouter(() => ({
    home: () => HomeScreen,
  }));

  class HomeScreen extends React.Component {
    static route = {
      navigationBar: {
        title: 'Home',
      }
    }

    render() {
      return (
        <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
          <Text onPress={this._handlePress}>HomeScreen!</Text>
        </View>
      )
    }

    _handlePress = () => {
      this.props.navigator.push('home');
    }
  }

First we create a router, where we map keys to screens. ``HomeScreen`` is our
first **route component**, which we make clear by setting a ``static route`` object
property on it. From here, we can configure various aspects of the route, such as
the transtion style and what buttons to render in the navigation bar. Components that
are registered as routes will have a special prop ``navigator`` passed in, which allows
you to perform navigation actions like ``push`` and ``pop``. In this case, we would
be pushing home screens on top of home screens. But for this to work, we need to
first put the ``home`` route inside of a ``StackNavigation`` so that we have a
navigation stack to push to and pop from.

We initialize ExNavigation in our app by putting a ``NavigationProvider`` at
the root of the app. We then render a ``StackNavigation`` child, and set its
``initialRoute`` to the ``home`` route that we defined in ``createRouter``.

.. code-block:: javascript

  class App extends React.Component {
    render() {
      return (
        <NavigationProvider router={Router}>
          <StackNavigation initialRoute="home" />
        </NavigationProvider>
      );
    }
  }

  Exponent.registerRootComponent(App);

Reviewing the tab template
^^^^^^^^^^^^^^^^^^^^^^^^^^

You probably don't want to start all of your projects completely from scratch, and
the tab template is one of many to come from Exponent that will hopefully give
you a headstart on building your app. It comes with ``@exponent/ex-navigation``
pre-installed, and tab navigation set up for you.

Let's look at the project structure of the tab template as it relates to
navigation. This is not a pattern that you absolutely must follow, but we find
it works quite well for us.

.. code-block:: text

  ├── main.js
  ├── navigation
  │   ├── RootNavigation.js
  │   └── Router.js
  ├── screens
  │   ├── HomeScreen.js
  │   ├── LinksScreen.js
  │   └── SettingsScreen.js

main.js
-------

In Exponent apps, this file is typically where you will register the root
component of your app. At the root, you typically include any higher order
``Provider`` components, such as the ``react-redux`` ``Provider``, and the
ExNavigation ``NavigationProvider``. As you can see in the above example, we
usually also render our root ``StackNavigation`` component at the root. Most
apps are composed of many nested stacks, which we will see here.

screens/*Screen.js
------------------

I've organized all of the route components that represent screens in our app
into a ``Screens`` directory (a screen is not strictly defined anywhere, it
is up to you to decide what you think fits -- for me this is usually anything
that I would ``push`` or ``pop`` from a stack).

navigation/Router.js
--------------------

In the simple example above, we in-lined our Router in ``main.js`` -- this can
be fine to do for a while, but eventually it can grow long enough that it becomes
cleaner to pull out into its own file. There may also be cases where you will want
to import the router directly.

navigation/RootNavigation.js
----------------------------

This component is responsible for rendering our root navigation layout -- in this
project, we use tabs. You might use a drawer layout here on Android, alternatively,
or some other kind of layout. In the template, the ``StackNavigation`` that we render
in ``main.js`` will only ever point to the ``RootNavigation`` screen, and each of
the tabs renders their own ``StackNavigation`` component.

Another responsibility that we have given to this component is to subscribe to
push notifications, so that when one is received or selected, we can respond by
navigating to a new route.

Learning more about routing & navigation
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``ExNavigation`` is not the only routing library, but it is our
recommended approach and we might not be able to answer your questions about other libraries.
You can learn more about it `on the Github repository <https://github.com/exponentjs/ex-navigation>`_,
and by reading the code of other applications built with ``ExNavigation``, such as
`Growler Prowler <https://github.com/brentvatne/growler-prowler>`_, `React Native Playground <https://github.com/exponentjs/rnplay>`_,
and the `ExNavigation example app <https://github.com/exponentjs/ex-navigation/tree/master/example>`_.
