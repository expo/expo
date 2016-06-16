**********************
Upgrading Exponent
**********************

.. epigraph::
  **Note**: It isn't strictly necessary to update your app when a new version of Exponent
  is released.  New versions of the Exponent client are backwards compatible
  with apps published for previous versions for at least one year. This means
  that you can download a new version of the Exponent client and open apps that
  were published for previous versions and they will work perfectly.

  That said, each version is better than the last, so you might want to stay up
  to date to take advantage of new features and performance improvements.

When a new version of Exponent is released, you may want to update your project
so that it's compatible with the latest version.

* **Close XDE**

* **Find out what the latest version of Exponent is**
  * `See a list of versions <https://getexponent.com/--/abi-versions>`_ and pick the one with the biggest number. You will use the ``exponent-react-native-tag`` in the next step.

* **Update the version of react-native that your project depends on**
  * Open your project's ``package.json`` file and find the ``"react-native"`` entry under the ``"dependencies"`` section.
  * Its value should look like ``"exponentjs/react-native#sdk-x.y.z"``. Replace the ``sdk-x.y.z`` with the ``exponent-react-native-tag`` from the previous step.

* **Update the version of Exponent SDK**
  * Open your project's ``package.json`` file and find the ``"exponent"`` entry under the ``"dependencies"`` section.
  * Change the version matcher to something like ``^6.0.0``, but replace ``6.0.0`` with the sdk version from the previous step.
  * Delete your ``node_modules`` directory and run ``npm install``. I like to do ``npm install && say wake up``.

* **Update XDE**
  * XDE looks for updates automatically, so it might already have already installed and asked you to restart it. If it didn't, you can grab the latest release `from Github <https://github.com/exponentjs/xde/releases>`_.

* **Open your project and clear the packager cache**

If all went well, your project should run in the latest version of Exponent.
Sometimes there may be issues if React Native changed its API, in which case
you'll usually get error messages telling you what's wrong. Usually, though,
projects mostly just work.
