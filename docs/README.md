# Exponent Documentation

Hi! This is what will make Exponent actually be useable by people. :)

## How to edit

### As a random person

Thanks for helping! :D Just make your changes on a fork of this repository or
whatever works for you and submit a pull request. We'll take a look and
incorporate them!

### As an Exponent developer

Make your changes in `universe/docs` and commit them. Then, in `universe`, run
`git subrepo push docs` (make sure to run this at the root of the repository).
This will push to the public repository, which triggers a webhook that rebuilds
the documentation (generating the online version, pdf and epub) automatically.
