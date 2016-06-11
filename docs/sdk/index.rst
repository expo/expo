.. _exponent-sdk:

Exponent SDK
============

The Exponent SDK provides access to system functionality such as contacts,
camera, and social login. It is provided by the npm package `exponent
<https://www.npmjs.com/package/exponent>`_. Install it by running ``npm
install --save exponent`` in the root directory of the project. Then you can
import it in your JavaScript code as follows:

.. code-block:: javascript

  import Exponent from 'exponent';

If you prefer, you can also use destructuring imports:

.. code-block:: javascript

  import { Contacts } from 'exponent';

This allows you to write ``Contacts.getContactsAsync()`` instead of
:func:`Exponent.Contacts.getContactsAsync`, for example.

.. raw:: html

    <h2>Modules</h2>

.. toctree::
   :maxdepth: 2

   constants
   contacts
   facebook
   font
   imagepicker
