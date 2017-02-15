Font
====

Allows loading fonts from the web and using them in React Native components.

.. function:: Exponent.Font.loadAsync(name, url)

   Load a font from the web and associate it with the given name.

   :param string name:
      A name by which to identify this font. You can make up any name you want;
      you just have to specify the same name in :func:`Exponent.Font.style` to
      use this font.

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

.. function:: Exponent.Font.style(name)

   Return style properties to use with a ``Text`` or other React Native
   component. It is safe to call this function before calling
   :func:`Exponent.Font.loadAsync`; it will still return the correct style
   properties. This way you can use this function with ``StyleSheet.create()``.

   :param string name:
      The name for this font specified in :func:`Exponent.Font.loadAsync`.

   :returns:
      An object with style attributes to use in a ``Text`` or similar component.

   :example:
      .. code-block:: javascript

        <Text style={{ ...Exponent.Font.style('cursive'), color: 'red' }}>
          Hello world!
        </Text>

      Before the component is rendered, the font must be loaded by calling
      ``Exponent.Font.loadAsync('cursive', 'http://url/to/font.ttf')``.

