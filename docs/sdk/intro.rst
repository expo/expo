Introduction
============

The Exponent SDK provides access to system functionality such as contacts,
camera, location. It is provided by the npm package `exponent
<https://www.npmjs.com/package/exponent>`_. Install it by running ``npm
install --save exponent`` in the root directory of the project. Then you can
import it in your JavaScript code as follows::

  import Exponent from 'exponent';

You can also use destructuring imports::

  import { Contacts } from 'exponent';

This allows you to call the function :func:`Exponent.Contacts.getContactsAsync`
simply using ``Contacts.getContactsAsync()`` for example.
