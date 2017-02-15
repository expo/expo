.. _xde-tour:

********
XDE Tour
********

Sign in screen
^^^^^^^^^^^^^^

.. figure:: img/xde-signin.png
  :width: 100%
  :alt: XDE sign in screen

  When you open XDE for the first time you'll be greeted by this sign in screen. If you have an account already, go ahead and sign in. If you don't, fill out your desired username and password and sign in. If the username is available, we'll create the account for you.

Home screen
^^^^^^^^^^^

.. figure:: img/xde-signin-success.png
  :width: 100%
  :alt: XDE home

  Success, you're logged in! From this screen you may want to create a new project or open an existing one. We list some of your most recently opened projects for convenience.

Project dialog
^^^^^^^^^^^^^^

.. figure:: img/xde-project-dialog.png
  :width: 100%
  :alt: XDE home project dialog

  Click on Project and you'll see everything you can do from here. Naturally you cannot close a project or show it in finder, etc, because you don't have one opened yet.

Sign out, if you want
^^^^^^^^^^^^^^^^^^^^^

.. figure:: img/xde-signout.png
  :width: 100%
  :alt: XDE sign out

  At any time you can click on your username in the top right and sign out. Or log out. Who can really agree on the verbiage?

Project screen
^^^^^^^^^^^^^^

.. figure:: img/xde-project-opened.png
  :width: 100%
  :alt: XDE project

  So we've opened up a new project. The left pane is the React Packager, which you can learn more about in :ref:`Up and Running <up-and-running>` and in :ref:`How Exponent Works <how-exponent-works>`. The right pane is for device logs, which you can read more about in :ref:`Viewing Logs <logging>`.

Send link
^^^^^^^^^

.. figure:: img/xde-send-link.png
  :width: 100%
  :alt: XDE send link

  Send a link to your app to anybody with an internet connection. This is also useful for getting the link on your device if you don't have it connected to your computer.

Opening on a device
^^^^^^^^^^^^^^^^^^^

.. figure:: img/xde-device.png
  :width: 100%
  :alt: XDE open on device

  The device button lets you quickly open your app on a device or simulator. Read more in :ref:`Up and Running <up-and-running>`.

.. _xde-development-mode:
Development mode
^^^^^^^^^^^^^^^^

.. figure:: img/xde-development-mode.png
  :width: 100%
  :alt: XDE project development mode

  You'll often want to work on your project in development mode. This makes it run a bit more slowly because it adds a lot of runtime validations of your code to warn you of potential problems, but it also gives you access to live reloading, hot reloading, remote debugging and the element inspector. Disable Development Mode and reload your app if you want to test anything related to performance.

Project dialog (with project open)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. figure:: img/xde-project-opened.png
  :width: 100%
  :alt: XDE project dialog in open project

  In addition to the options provided from the home screen, with a project opened we give you access to a few shortcuts like showing the project directory in finder.

Publish
^^^^^^^

.. figure:: img/xde-publish.png
  :width: 100%
  :alt: XDE publish

  When you hit publish you'll be asked to confirm that you want your project to be available to the public. Hitting yes will upload all of your assets and your apps JavaScript to our servers so that users can access it at any time from ``exp.host/@your-username/your-app-slug``. More on what slug means in :ref:`Configuration with exp.json <exp>`, and more details about how publishing work in :ref:`How Exponent Works <how-exponent-works>`.
