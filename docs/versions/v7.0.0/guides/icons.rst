*****
Icons
*****

As trendy as it is these days, not every app has to use emoji for all icons 😳
-- maybe you want to pull in a popular set through an icon font like
FontAwesome, Glyphicons or Ionicons, or you just use some PNGs that you
carefully picked out on `The Noun Project <https://thenounproject.com/>`_
(Exponent does not currently support SVGs).  Let's look at how to do both of
these approaches.

@exponent/vector-icons
======================

This library is installed by default on the template project that you create through XDE. It includes eight icon sets,
you can browse all of the icons using the `@exponent/vector-icons directory <https://exponentjs.github.io/vector-icons/>`_.

.. image:: img/vector-icons-directory.png
  :width: 100%
  :target: https://exponentjs.github.io/vector-icons/

Example
^^^^^^^^
  .. code-block:: javascript

    import React from 'react';
    import { View } from 'react-native';
    import { Font } from 'exponent';
    import { Ionicons } from '@exponent/vector-icons';

    export default class IconExample extends React.Component {
      state = {
        isFontLoaded: false,
      };

      async componentWillMount() {
        await Font.loadAsync(Ionicons.font);
        this.setState({isFontLoaded: true});
      }

      render() {
        if (!this.state.isFontLoaded) {
          return <View />;
        }

        return (
          <Ionicons name="md-checkmark-circle" size={32} color="green" />
        );
      }
    }

  This component loads the Ionicons font if it hasn't been loaded already, and
  renders a checkmark icon that I found through the vector-icons directory
  mentioned above. Typically you will load the font in your root app component
  so that the rest of the app is able to assume that it is loaded. There may
  be some cases, however, where you want to load it later on. For example,
  perhaps you only use the font on one screen that isn't commonly visited -- in
  this case it might make sense to defer loading the font until that screen is
  going to be rendered in order to save bandwidth and improve your app's initial
  load time.


``@exponent/vector-icons`` is built on top of `react-native-vector-icons
<https://github.com/oblador/react-native-vector-icons>`_ and uses the same API
-- so if you've used that at all you'll be right at home.

Icon images
===========

If you know how to use the react-native ``<Image>`` component this will be a breeze.


  .. code-block:: javascript

    import React from 'react';
    import { Image } from 'react-native';

    export default class SlackIcon extends React.Component {
      render() {
        return (
          <Image
            source={require('../assets/images/slack-icon.png')}
            fadeDuration={0}
            style={{width: 20, height: 20}}
          />
        );
      }
    }

  Let's assume that our ``SlackIcon`` class is located in
  ``my-project/components/SlackIcon.js``, and our icon images are in
  ``my-project/assets/images``, in order to refer to the image we use require
  and include the relative path. You can provide versions of your icon at
  various pixel densities and the appropriate image will be automatically
  used for you.  In this example, we actually have ``slack-icon@2x.png`` and
  ``slack-icon@3x.png``, so if I view this on an iPhone 6s the image I will
  see is ``slack-icon@3x.png``. More on this in the `Images guide in the
  react-native documentation
  <https://facebook.github.io/react-native/docs/images.html#static-image-resources>`_.

  We also set the ``fadeDuration`` (an Android specific property) to ``0``
  because we usually want the icon to appear immediately rather than fade in
  over several hundred milliseconds.
