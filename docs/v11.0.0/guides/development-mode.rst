.. _development-mode:

================
Development Mode
================

React Native includes some very useful tools for development: remote JavaScript
debugging in Chrome, live reload, hot reloading, and an element inspector
similar to the beloved inspector that you use in Chrome. It also performs
bunch of validations while your app is running to give you warnings if
you're using a deprecated property or if you forgot to pass a required
property into a component, for example.

.. figure:: img/development-mode.png
  :width: 100%
  :alt: Screenshots of development mode in action

**This comes at a cost: your app runs slower in development mode.** You can
toggle it on and off from XDE. When you switch it, just close and re-open
your app for the change to take effect. **Any time you are testing the
performance of your app, be sure to disable development mode**.

Toggling Development Mode in XDE
""""""""""""""""""""""""""""""""

.. image:: img/toggle-development-mode.png
  :width: 100%
