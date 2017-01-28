.. _exp-cli:

==================
``exp`` Command-Line Interface
==================

In addition to XDE we also have a CLI ``exp`` if you prefer to work on the command line or want to use Exponent in tests or continuous integration (CI).

Installation
""""""""""""

Run ``npm install -g exp`` to install ``exp`` globally.

If you haven't used ``exp`` or XDE before, the first thing you'll need to do is login
with your Exponent account using ``exp login``.

Commands
""""""""

View the list of commands using ``exp --help``:

.. code-block:: none

  Usage: exp [options] [command]


  Commands:

    android [options] [project-dir]           Opens your app in Exponent on a connected Android device
    build:ios|bi [options] [project-dir]      Build a standalone IPA for your project, signed and ready for submission to the Apple App Store.
    build:android|bi [options] [project-dir]  Build a standalone APK for your project, signed and ready for submission to the Google Play Store.
    build:status|bs [project-dir]             Gets the status of a current (or most recently finished) build for your project.
    convert|onentize [project-dir]            Initialize Exponent project files within an existing React Native project
    diagnostics [project-dir]                 Uploads diagnostics information and returns a url to share with the Exponent team.
    doctor [project-dir]                      Diagnoses issues with your Exponent project.
    init|i [options] [project-dir]            Initializes a directory with an example project
    ios [options] [project-dir]               Opens your app in Exponent in an iOS simulator on your computer
    login [options]                           Login to exp.host
    logout                                    Logout from exp.host
    logs|l [options] [project-dir]            Streams the logs
    publish|p [options] [project-dir]         Publishes your project to exp.host
    send [options] [project-dir]              Sends a link to your project to a phone number or e-mail address
    signup [options]                          Creates a user on exp.host
    start|r [options] [project-dir]           Starts or restarts a local server for your app and gives you a URL to it
    status|s [options] [project-dir]          Shows the status of the Exponent packager/server process started
    stop|q [options] [project-dir]            Stops the server
    url|u [options] [project-dir]             Displays the URL you can use to view your project in Exponent
    whoami|w                                  Checks with the server and then says who you are logged in as

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -o, --output [format]  Output format. pretty (default), raw


View additional information about a specific command by passing the ``--help`` flag. For example, ``exp start --help`` outputs:

.. code-block:: none

  Usage: start|r [options] [project-dir]

  Starts or restarts a local server for your app and gives you a URL to it

  Options:

    -h, --help             output usage information
    -s, --send-to [dest]   A phone number or e-mail address to send a link to
    -c, --clear            Clear the React Native packager cache
    -a, --android          Opens your app in Exponent on a connected Android device
    -i, --ios              Opens your app in Exponent in a currently running iOS simulator on your computer
    -q, --qr               Will generate a QR code for the URL
    -m, --host [mode]      tunnel (default), lan, localhost. Type of host to use. "tunnel" allows you to view your link on other networks
    -p, --protocol [mode]  exp (default), http, redirect. Type of protocol. "exp" is recommended right now
    --tunnel               Same as --host tunnel
    --lan                  Same as --host lan
    --localhost            Same as --host localhost
    --dev                  Turns dev flag on
    --no-dev               Turns dev flag off
    --strict               Turns strict flag on
    --no-strict            Turns strict flag off
    --minify               Turns minify flag on
    --no-minify            Turns minify flag off
    --exp                  Same as --protocol exp
    --http                 Same as --protocol http
    --redirect             Same as --protocol redirect
    --foreground           Start in the foreground. Not recommended. Use "exp logs" instead
