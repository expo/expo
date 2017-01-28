.. _using-clojurescript:

Using ClojureScript
===================

Quickstart
""""""""""

If you're already convinced about ClojureScript and Exponent and know what to
do once you have figwheel running, you can just read this section. Otherwise,
we encourage you to read the entire guide.

.. code-block:: bash

   lein new exponent your-project

   cd your-project && npm install

   lein figwheel

   # Now in a new tab, open the project in a simulator
   exp start --ios

.. epigraph::
  **Note:** This guide was written by `@tiensonqin <https://github.com/tiensonqin>`_, feel free to reach out to him on the `Exponent Slack <http://slack.getexponent.com/>`_ if you have questions!

Why Clojurescript?
""""""""""""""""""

- First-class immutable data structures
- Minimizing state and side-effects
- Practicality and pragmatism are always core values of ClojureScript
- Lisp!
- Great JavaScript interoperability

Why on Exponent?
""""""""""""""""

It all begins with a `Simple Made Easy
<https://www.infoq.com/presentations/Simple-Made-Easy>`_ design choice: **you
don't write native code**.

- You only write ClojureScript or JavaScript.
- You don't have to install or use Xcode or Android Studio or deal with any of
  the platform specific configuration and project files.
- Much easier to upgrade when there is no native code involved -- React Native
  JavaScript APIs are relatively stable compared to the native side. Exponent
  will take care of upgrading the native modules and React Native versions, you
  only need to upgrade your ClojureScript or JavaScript code.
- You can write iOS apps on Linux or Windows (provided that you have an iPhone
  to test it with).
- It's dead simple to continually share your apps. Once you published your app,
  you got a link. It is up to you to share the link.

1. Create an Exponent project
"""""""""""""""""""""""""""""

.. code-block:: bash

   # Default to use Reagent / Re-frame
   lein new exponent your-project

   # Or Om Next
   lein new exponent your-project +om

   cd your-project && npm install

2. Connect to a REPL
""""""""""""""""""""

CLI REPL
''''''''

.. code-block:: bash

   lein figwheel

Emacs REPL
'''''''''''

1. Invoke cider-jack-in.
2. Run ``(start-figwheel)`` in the connected REPL.

`Cursive <https://cursive-ide.com/>`_ REPL
''''''''''''''''''''''''''''''''''''''''''

The first time you connect to the repl, you'll need to create a Leiningen nREPL
Configuration unless you have one already.

1. Click ``Run->Edit`` configurations.
2. Click the ``+`` button at the top left and choose Clojure REPL.
3. Choose a ``Local REPL``.
4. Enter a name in the Name field (e.g. "REPL").
5. Choose the radio button ``Use nREPL with Leiningen``.
6. Click the ``OK`` button to save your REPL config.

Once this is done, you can connect to the REPL.

In Intellij make sure your REPL config is selected and click the green **play**
button to start your REPL.

Run ``(start-figwheel)`` in the connected REPL.

3. Start Exponent server
""""""""""""""""""""""""

Using ``exp`` CLI
'''''''''''''''''

.. code-block:: bash

   # Install exp if you have not already
   npm install -g exp

   # Connect to iOS simulator
   exp start --ios

   # Or connect to Android devices or simulators
   exp start --android

For more information, see :ref:`exp Command-Line Interface <exp-cli>`.

Using XDE
'''''''''

For more information, see :ref:`XDE tour <xde-tour>`.

4. Publish your app
"""""""""""""""""""

.. code-block:: bash

   # Generate main.js
   lein prod-build

   exp publish

This will publish your app to a persistent URL on getexponent.com, for example: https://getexponent.com/@community/startr

FAQ
"""

How do I add custom native modules?
'''''''''''''''''''''''''''''''''''

See :ref:`How do I add custom native code to my Exponent project? <faq>`.

Does it support Google Closure advanced compilation?
''''''''''''''''''''''''''''''''''''''''''''''''''''
It's still experimental, but it already works for multiple projects.

Does it support source maps?
''''''''''''''''''''''''''''
Yes.

Can I use npm modules?
''''''''''''''''''''''
React Native uses JavascriptCore, so modules using built-in node like stream, fs, etc wont work. Otherwise, you can just require like: ``(js/require "SomeModule")``.

Do I need to restart the REPL after adding new Javascript modules or assets?
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
No, you do need to reload Javascript. To do that, select **Reload** from the Developer Menu.
You can also press ``⌘ + R`` in the iOS Simulator, or press ``R`` twice on Android emulators.


Will it support Boot?
'''''''''''''''''''''
Not currently, but we are working on it.
