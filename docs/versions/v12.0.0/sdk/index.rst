.. _exponent-sdk:

SDK API Reference
=======================

The Exponent SDK provides access to system functionality such as contacts,
camera, and social login. It is provided by the npm package `exponent
<https://www.npmjs.com/package/exponent>`_. Install it by running ``npm
install --save exponent`` in the root directory of the project. Then you can
import modules from it in your JavaScript code as follows:

.. code-block:: javascript

  import { Contacts } from 'exponent';

You can also import all Exponent SDK modules:

.. code-block:: javascript

  import * as Exponent from 'exponent';

This allows you to write :func:`Exponent.Contacts.getContactsAsync`, for
example.

.. raw:: html

    <h2>Modules</h2>

.. toctree::
   :maxdepth: 2

   accelerometer
   amplitude
   app-loading
   asset
   bar-code-scanner
   blur-view
   constants
   contacts
   facebook
   font
   gl-view
   google
   gyroscope
   imagepicker
   linear-gradient
   location
   map-view
   notifications
   permissions
   segment
   svg
   take-snapshot-async
   util
   video
