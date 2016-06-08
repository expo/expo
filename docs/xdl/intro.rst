Introduction
============

XDL (Exponent Development Library) is used for building tools for Exponent
developers such as `XDE <https://github.com/exponentjs/xde>`_ and
`exp <https://github.com/exponentjs/exp>`_.

It is provided by the npm package `xdl
<https://www.npmjs.com/package/xdl>`_. Install it by running ``npm
install --save xdl`` in the root directory of the project. Then you can
import it in your JavaScript code as follows:

.. code-block:: javascript

  import xdl from 'xdl';

You can also use destructuring imports:

.. code-block:: javascript

  import { User } from 'xdl';

This allows you to call the function :func:`xdl.User.loginAsync`
simply using ``User.loginAsync()`` for example.
