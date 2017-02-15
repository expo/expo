User
===========

Provides access to the user's Exponent account.

.. function:: xdl.User.loginAsync(options)

   Log in to Exponent's servers.

   :param object options:
      A map of options:

      * **username** (*string, required*) -- Username.

      * **password** (*string, required*) -- Password.

   :returns:
      If login fails, returns ``Promise<null>``.

      Otherwise, returns ``Promise<{username: string}>``.


.. function:: xdl.User.logoutAsync()

   Log out of Exponent's servers.


.. function:: xdl.User.getCurrentUserAsync()

   Ask Exponent's servers to return the current logged in user.

   :returns:
      Returns ``Promise<{username: string}>`` or ``Promise<null>``.
