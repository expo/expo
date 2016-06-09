Font
====

Allows loading fonts from the web and using them in React Native components.

.. function:: Exponent.Font.loadAsync(name, url)

   Load a font for use later.

   :param string name:
      A user-defined name to identify this font by later. You can make up any
      name you want, you just have to specify the same name in
      :func:`Exponent.Font.style` to use this font.

   :returns:
      Doesn't return anything, simply awaits till the font is available to use.

.. function:: Exponent.Font.style(name)

   Return style attributes to use with a ``Text`` or other React Native
   component to use a font loaded with :func:`Exponent.Font.loadAsync`. You can
   even call this function before calling :func:`Exponent.Font.loadAsync`, it
   will return the correct style attributes. This way you can use this function
   with ``StyleSheet.create()`` at global scope.

   :param string name:
      The user-defined name for this font specified in :func:`Exponent.Font.loadAsync`.

   :returns:
      An object with style attributes to use in a ``Text`` or similar component.

   Here's an example use of this function:

   .. code-block:: javascript

     <Text style={{ ...Exponent.Font.style('helloFont'), color: 'red' }}>
       HELLO WORLD
     </Text>

   Before the component is rendered, the font must be loaded by calling
   ``Exponent.Font.loadAsync('helloFont', 'http://url/to/font.ttf')``.

