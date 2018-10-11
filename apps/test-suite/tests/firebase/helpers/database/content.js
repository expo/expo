module.exports = {
  DEFAULT: {
    array: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    boolean: true,
    string: 'foobar',
    number: 123567890,
    object: {
      foo: 'bar',
    },
  },

  NEW: {
    array: [9, 8, 7, 6, 5, 4],
    boolean: false,
    string: 'baz',
    number: 84564564,
    object: {
      foo: 'baz',
    },
  },

  QUERY: [
    {
      search: 'foo',
    },
    {
      search: 'bar',
    },
    {
      search: 'blah',
    },
  ],

  ISSUES: {
    // https://github.com/invertase/react-native-firebase/issues/100
    100: {
      1: {
        someKey: 'someValue',
        someOtherKey: 'someOtherValue',
      },
      2: {
        someKey: 'someValue',
        someOtherKey: 'someOtherValue',
      },
      3: {
        someKey: 'someValue',
        someOtherKey: 'someOtherValue',
      },
    },

    // https://github.com/invertase/react-native-firebase/issues/108
    108: {
      foobar: {
        name: 'Foobar Pizzas',
        latitude: 34.1013717,
      },
      notTheFoobar: {
        name: "Not the pizza you're looking for",
        latitude: 34.456787,
      },
      notAFloat: {
        name: 'Not a float',
        latitude: 37,
      },
    },

    // https://github.com/invertase/react-native-firebase/issues/171
    171: {
      10053768200609241: {
        email: 'emaila@hotmail.com',
        name: 'Sek Ranger',
        profile_picture: 'https://url.to/picture',
        uid: 'n6V8vACidyW4OKxnELkBbW83JaS2',
      },
      10053925505239749: {
        email: 'emailb@hotmail.com',
        name: 'Gu Hungry',
        profile_picture: 'https://url.to/picture',
        uid: 'Qq4Pwm7H2kO6sJIMLAJxuhAGGh22',
      },
      10106631429240929: {
        email: 'emailc@gmail.com',
        name: 'Chwang',
        profile_picture: 'https://url.to/picture',
        uid: 'T7VVrveS0dPs3idmgetLUfQsLZs1',
      },
      10106631429240930: {
        email: 'emaild@gmail.com',
        name: 'Introv Bigs',
        profile_picture: 'https://url.to/picture',
        uid: 'aNYxLexOb2WsXGOPiEAu47q5bxH3',
      },
    },

    489: {
      long1: 1508777379000,
    },

    // https://github.com/invertase/react-native-firebase/issues/521
    521: {
      key1: {
        name: 'Item 1',
        number: 1,
        string: 'item1',
      },
      key3: {
        name: 'Item 3',
        number: 3,
        string: 'item3',
      },
      key2: {
        name: 'Item 2',
        number: 2,
        string: 'item2',
      },
    },
  },
};
