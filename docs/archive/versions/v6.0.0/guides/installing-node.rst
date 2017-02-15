.. _installing-node:

******************
Installing Node.js
******************

This is a guide to installing Node.js on your computer. To do anything interesting with Exponent, you'll need to have ``node`` and ``npm`` installed.

What versions of Node can I use with Exponent?
""""""""""""""""""""""""""""""""""""""""""""""

We recommend running the current stable version of Node (at the time of this writing v6.3.0), but anything as new as the most recent LTS stable version (at the time of this writing v4.4.7) should work.

We test against the current stable version of Node, and so things will generally work out best for you if you use `nvm <https://github.com/creationix/nvm#install-script>`_ to keep up-to-date with the current version of Node


If you already have Node on your computer
""""""""""""""""""""""""""""""""""""""""""""

If you already have it on your computer, you can just use the version you already have--as long as its recent enough (see above).

You can run ``node -v`` to see what version you have.

Note that versions 0.12.x and 0.10.x are too old and won't work.

If you don't have Node.js installed on your computer, it's easy to install it, so read on.

If you have a Mac
"""""""""""""""""

If you have a Mac, we think the best way to install Node is to use `nvm <https://github.com/creationix/nvm#install-script>`_.  ``nvm`` is really nice because its simple to install the latest version of Node, or any version of Node; but it also makes it really easy to upgrade to the most current version when new versions of Node come out.

And if you ever need to use different versions of Node for different projects on the same machine, nvm is definitely the best way to handle that.

Once you install `nvm`, open a new terminal window and then type ``nvm install node``. This will install the current stable version of Node and make it the default version that will run when you type ``node``. Verify that this worked by running ``node -v``.

If for some reason you prefer not to use nvm to install and manage Node on your machine, you can either use Homebrew to install Node (``brew install node``) or install the current version from `the nodejs.org website <https://nodejs.org>`_, but we recommend using ``nvm`` so that you can update more easily.

If you are running Linux (or similar)
"""""""""""""""""""""""""""""""""""""

If you are running *nix, we also recommmend using `nvm <https://github.com/creationix/nvm#install-script>`_ for the same reasons as we do on Mac.

You should be able to install Node using your package manager of choice and have it work though, as long as its new enough.

If you are running Windows
""""""""""""""""""""""""""

*Exponent support for Windows is currently in Alpha. You'll need to download the source code for xde from master and run it yourself rather than using a release at this time.*

If you are running Windows, you can either just download Node from the `the nodejs.org website <https://nodejs.org>`_ (get the current version).

Or you can use `nvm-windows <https://github.com/coreybutler/nvm-windows>`_, which is a separate project from nvm, but works pretty well for me.
