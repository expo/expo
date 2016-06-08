Project
===========

Provides access to an Exponent project. Each function takes the project's root
directory as it's first argument.

Exponent needs three components running to work correctly: a local Exponent server,
the React Native packager, and tunnels over both of those urls. If you need to use
an existing packager instance you can call :func:`xdl.Project.setOptionsAsync` to
give the Exponent server information about the existing packager and use
:func:`xdl.Project.startExponentServerAsync` and :func:`xdl.Project.startTunnelsAsync`
to start the other components.

.. function:: xdl.Project.startAsync(projectRoot, options)

   Start everything needed to run an Exponent project. Starts the React Native
   packager, the Exponent server, and tunnels.

   :param string projectRoot:
      Project root directory.

   :param object options:
      A map of options:

      * **reset** (*boolean*) -- Reset the React Native cache.


.. function:: xdl.Project.stopAsync(projectRoot, options)

   Stops everything started by ``xdl`` on a project. If an external React Native
   packager was specified through :func:`xdl.Project.setOptionsAsync` it will not
   be stopped.

   :param string projectRoot:
      Project root directory.


.. function:: xdl.Project.getUrlAsync(projectRoot, options)

   Returns a url for this Exponent project.

   :param string projectRoot:
      Project root directory.

   :param object options:
      A map of options:

      * **urlType** (*string*) -- One of 'exp' (default), 'http', 'redirect'.

      * **hostType** (*string*) -- One of 'tunnel' (default), 'lan', 'localhost'.

      * **dev** (*boolean*) -- Dev mode.

      * **minify** (*boolean*) -- Minify the bundle.

   :returns:
      ``url``


.. function:: xdl.Project.publishAsync(projectRoot, options)

   Publishes a project to Exponent's servers.

   :param string projectRoot:
      Project root directory.

   :param object options:
      A map of options:

      * **quiet** (*boolean*) -- Don't post a notification to our slack channel.

   :returns:
      ``{ url }``


.. function:: xdl.Project.startExponentServerAsync(projectRoot)

   Starts an Exponent server for the project. This is used to server the manifest
   which contains information about the project name, icon, etc.

   :param string projectRoot:
      Project root directory.


.. function:: xdl.Project.stopExponentServerAsync(projectRoot)

   Stops the Exponent server for the project. Use :func:`xdl.Project.stopAsync`
   instead in most cases.

   :param string projectRoot:
      Project root directory.


.. function:: xdl.Project.startReactNativeServerAsync(projectRoot, options)

   Starts the React Native packager for the project.

   :param string projectRoot:
      Project root directory.

   :param object options:
      A map of options:

      * **reset** (*boolean*) -- Reset the React Native cache.


.. function:: xdl.Project.stopReactNativeServerAsync(projectRoot)

   Stops the React Native packager for the project. Use :func:`xdl.Project.stopAsync`
   instead in most cases.

   :param string projectRoot:
      Project root directory.


.. function:: xdl.Project.startTunnelsAsync(projectRoot, options)

   Starts tunnels over the Exponent server and the React Native packager. Both
   need to be started or else this will throw an error.

   :param string projectRoot:
      Project root directory.


.. function:: xdl.Project.stopTunnelsAsync(projectRoot)

   Stops tunnels.

   :param string projectRoot:
      Project root directory.


.. function:: xdl.Project.setOptionsAsync(projectRoot, options)

   Manually specify information about the React Native packager.

   :param string projectRoot:
      Project root directory.

   :param object options:
      A map of options:

      * **packagerPort** (*number*) -- Port number of an existing React Native packager.
