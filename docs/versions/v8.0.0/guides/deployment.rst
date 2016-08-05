.. _deployment:

**********
Deployment
**********

Deployment for Exponent means compiling your JavaScript bundle with production
flags enabled (minify, disable runtime development checks) and uploading it,
any assets that it requires (see ::ref:`Assets <assets>`), and your
``exp.json`` configuration. As soon as the publish is complete, users
will receive the new version next time they open the app or refresh it.

.. epigraph::
  **Note:** To package your app for deployment on the Apple App Store or Google Play Store, see :ref:`Building Standalone Apps<building-standalone-apps>`. Each time you update the SDK version you will need to rebuild your binary.
