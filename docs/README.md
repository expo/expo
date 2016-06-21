# Exponent Documentation

Hi! This is what will make Exponent actually be useable by people. :)


## How to edit

### As a random person

Thanks for helping! :D Just make your changes on a fork of this repository or
whatever works for you and submit a pull request. We'll take a look and
incorporate them!

### As an Exponent developer

Make your changes in `universe/docs` and commit them. Our `shipit` bot
synchronizes the changes to the public `exponent-docs` repository. To deploy,
you will need Docker for Mac. Just run `./scripts/deploy.sh` from
`universe/docs`.

### Testing changes locally

Navigate to the documentation root.

#### With Docker (easy)

If your machine has Docker for Mac you can run:

```bash
./scripts/watch.sh
```

from this directory and be on your way. This will preview the `DEFAULT_VERSION`
according to the `Makefile`.

#### With Python (still easy, but environment dependent)

Make sure you have `python` and `pip` installed. Run,

```pip install -r requirements.txt```

Then run,

```make serve```

This will serve the docs site accessible at the URL given in the output of the
command. This will preview the `DEFAULT_VERSION` according to the `Makefile`.
When you edit and save one of the docs source files it builds and refreshes the
page automatically. You can also try a specific version like this,

```DEFAULT_VERSION=v6.0.0 make serve```

Version names correspond to directory names under `versions/`.

