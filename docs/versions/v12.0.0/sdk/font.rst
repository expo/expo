Font
====

Allows loading fonts from the web and using them in React Native components.
See more detailed usage information in the :ref:`Using Custom Fonts <using-custom-fonts>` guide.

.. function:: Exponent.Font.loadAsync(name, url)

   Load a font from the web and associate it with the given name.

   :param string name:
      A name by which to identify this font. You can make up any name you want;
      this will be the name that you use when setting ``fontFamily``. For example,
      if the name is ``'open-sans'`` then your ``Text`` component would look like:
      ``<Text style={{fontFamily: 'open-sans'}}>Hello world</Text>``

   :returns:
      Doesn't return anything and simply awaits till the font is available to
      use.

.. function:: Exponent.Font.loadAsync(map)

   Convenience form of :func:`Exponent.Font.loadAsync` that loads multiple fonts
   at once.

   :param object map:
      A map of names to urls as in :func:`Exponent.Font.loadAsync`.

   :returns:
      Doesn't return anything and simply awaits till all fonts are available to
      use.

   :example:
      .. code-block:: javascript

        Exponent.Font.loadAsync({
          title: 'http://url/to/font1.ttf',
          cursive: 'http://url/to/font2.ttf',
        });

      This is equivalent to calling :func:`Exponent.Font.loadAsync` once per name
      and URL pair.
