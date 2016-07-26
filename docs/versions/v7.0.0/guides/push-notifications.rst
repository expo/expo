.. _push-notifications:

******************
Push Notifications
******************

Push Notifications are an important feature to, as *"growth hackers"* would
say, retain and re-engage users and monetize on their attention, or something.
From my point of view it's just super handy to know when a relevant event
happens in an app so I can jump back into it and read more. Let's look at how
to do this with Exponent. Spoiler alert: it's almost too easy.

.. epigraph::
  **Note:** iOS and Android simulators cannot receive push notifications, to test them out you will need to use a real-life device.



Get Exponent token
Send it to your server
On your server, when you want to push to this user you send a POST request to ... with this format

Currently not possible:
- Silent pushes
- Collapse on individual pushes (key specified in
