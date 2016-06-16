**********************
Font Awesome for Icons
**********************

`Font Awesome <http://fontawesome.io/>`_ provides an icon set in the form of a
font, so that all you need to do to start using Font Awesome icons is use their
font and render Unicode characters! In this tutorial we'll learn how to use Font
Awesome in Exponent.


Starting code
=============

First let's start with a basic "Hello world!" app:

.. code-block:: javascript

  import {
    AppRegistry,
    Text,
    View,
  } from 'react-native';

  import React from 'react';

  class App extends React.Component {
    render() {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 56 }}>
            Hello, world!
          </Text>
        </View>
      );
    }
  }

  AppRegistry.registerComponent('main', () => App);

Try getting this basic app running before playing with Font Awesome so you can
get any basic setup issues out of the way.


Loading the font
================

We will load Font Awesome from the .ttf available on the web at
https://github.com/FortAwesome/Font-Awesome/raw/master/fonts/fontawesome-webfont.ttf.
To load and use fonts from the web we will use the :ref:`exponent-sdk`, which you can
install with ``npm install --save exponent`` in your project directory. Add the
following ``import`` in your application code:

.. code-block:: javascript

   import { Font } from 'exponent';

The ``exponent`` library provides an API to access native functionality of the
device from your JavaScript code. ``Font`` is the module that deals with
font-related tasks. First, we must load the font from the web using
:func:`Exponent.Font.loadAsync`. We can do this in the `componentDidMount()
<https://facebook.github.io/react/docs/component-specs.html#mounting-componentdidmount>`_
lifecycle method of the ``App`` component. Add the following method in ``App``:

.. code-block:: javascript

      class App extends React.Component {
        componentDidMount() {
          Font.loadAsync({
            awesome: 'https://github.com/FortAwesome/Font-Awesome/raw/master/fonts/fontawesome-webfont.ttf',
          });
        }

        // ...
      }

This loads Font Awesome and associates it with the name ``'awesome'`` in
Exponent's font map. Now we just have to refer to this font in our ``Text``
component.


Using the font in a ``Text`` component
======================================

You may remember that in React Native you specify fonts in ``Text`` components
using the ``fontFamily`` style property. Since it can be confusing to keep track
of the font family for the various .ttf files you load, Exponent provides the
function :func:`Exponent.Font.style` which returns the style properties
(including ``fontFamily``) for a font that you specify by name. So all you need
to do is change your ``Text`` element to the following:

.. code-block:: javascript

          <Text style={{ ...Font.style('awesome'), fontSize: 56 }}>
            Hello, world!
          </Text>

When you refresh the app, you will notice that the text looks the same.
Currently the content of our ``Text`` component is ``'Hello, world!'``. Font
Awesome uses unicode code points to refer to its icons. ``'\uf000'`` refers to
the 'glass' icon, let's try that one. Edit your ``Text`` element to the
following:

.. code-block:: javascript

          <Text style={{ ...Font.style('awesome'), fontSize: 56 }}>
            {'\uf000'}
          </Text>

On next refresh the app seems to still not display the text with Font Awesome.
You may see that it either shows an error character (like a question mark), or
some other character that isn't a glass. The problem is that
:func:`Exponent.Font.loadAsync` is an asynchronous call and takes some time to
complete. Before it completes, the ``Text`` component is already rendered with
the default font since it can't find the ``'awesome'`` font (which hasn't been
loaded yet).


Waiting for the font to load before rendering
=============================================

We need a way to re-render the ``Text`` component when the font has finished
loading. We can do this by keeping a boolean value ``fontLoaded`` in the ``App``
component's state that keeps track of whether the font has been loaded. We
render the ``Text`` component only if ``fontLoaded`` is ``true``.

First we initialize ``fontLoaded`` to false in the ``App`` class constructor:

.. code-block:: javascript

    class App extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          fontLoaded: false,
        };
      }

      // ...
    }

Next, we must set ``fontLoaded`` to ``true`` when the font is done loading.
:func:`Exponent.Font.loadAsync` returns a ``Promise`` that is fulfilled when the
font is successfully loaded and ready to use. So we simply have to add the
following after the ``await`` line in ``App.componentDidMount()``:

.. code-block:: javascript

      this.setState({ fontLoaded: true });

Finally, we want to only render the ``Text`` component if ``fontLoaded`` is
``true``. We can do this by replacing the ``Text`` element with the following:

.. code-block:: javascript

          {
            this.state.fontLoaded ? (
              <Text style={{ ...Font.style('awesome'), fontSize: 56 }}>
                {'\uf000'}
              </Text>
            ) : null
          }

A ``null`` child element is simply ignored by React Native, so this skips
rendering the ``Text`` component when ``fontLoaded`` is ``false``. Now on
refreshing the app you should see that it renders the Font Awesome glass icon!

The finished version of this tutorial is available as an Exponent project on
`GitHub <https://github.com/exponentjs/font-awesome-example>`_.
