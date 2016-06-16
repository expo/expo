# Exponent Documentation

Hi! This is what will make Exponent actually be useable by people. :)

## How to edit

### As a random person

Thanks for helping! :D Just make your changes on a fork of this repository or
whatever works for you and submit a pull request. We'll take a look and
incorporate them!

### As an Exponent developer

Make your changes in `universe/docs` and commit them. When our `shipit` bot
synchronizes the changes to the public `exponent-docs` repository, a webhook
will run that regenerates the HTML to display on the documentation website. All
you need to do is commit!

### Testing changes locally

Make sure you have `python` and `pip` installed. Run,

```pip install git+git://github.com/exponentjs/sphinx.git@master pygments-lexer-babylon sphinx-autobuild pygments-style-exponent```

Then, in `universe/docs`, run,

```rm -rf _build_html && PYGMENTS_NODE_COMMAND=node sphinx-autobuild . _build_html```

This will serve the docs site accessible at the URL given in the output of the
command. When you edit and save one of the docs source files it builds and
refreshes the page automatically.
