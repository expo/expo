XDL API Reference
==================

XDL (Exponent Development Library) is used for building tools for Exponent
developers such as `XDE <https://github.com/exponentjs/xde>`_ and
`exp <https://github.com/exponentjs/exp>`_.

It is provided by the npm package `xdl
<https://www.npmjs.com/package/xdl>`_. Install it by running ``npm
install --save xdl`` in the root directory of the project. Then you can
import it in your JavaScript code as follows:

.. code-block:: javascript

  import xdl from 'xdl';

If you prefer, you can also use destructuring imports:

.. code-block:: javascript

  import { User } from 'xdl';

This allows you to write ``User.loginAsync()`` instead of
:func:`xdl.User.loginAsync`, for example.

.. raw:: html

    <h2>Modules</h2>

.. toctree::
   :maxdepth: 2

   project
   user
