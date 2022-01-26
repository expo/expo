# Expo Test Suite

Hi! This is what will make Expo never break ever. 🙏
Learn more about this project in [CONTRIBUTING.md](https://github.com/expo/expo/blob/main/CONTRIBUTING.md).

## Running in the browser

You will need to run with HTTPS in a canary browser with SSL disabled. Otherwise you'll get `An SSL certificate error occurred when fetching the script.` thrown which may randomly break tests. This can be done by running `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir=/tmp/foo --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://localhost:19006` (don't browse the internet with this window).

## Running tests

Start up this project by running `expo start` from this directory. You can then select which tests you'd like to run from the initial screen. The tests are in `tests/` and their name is usually the same as the filename.

## Adding tests

Add a file in `tests/`, or, if your test falls into one of the categories already there, edit one of the files there. The `name` export of the module defines the test name. The module must export a function `test` that takes an argument `t` (an object providing the Jasmine interface) and sets up the Jasmine suites and specs. Read http://jasmine.github.io/2.4/introduction.html to learn how to use Jasmine. Functions such as `describe`, `it`, `expect`, etc. are available as `t.describe`, `t.it`, `t.expect`, etc. where `t` is the argument passed to `test`. Check out one of the tests already in `tests/` to get an idea of how stuff is done.

If you add a new file under `tests/` you must add it to the `testModules` list in `index.js` to have it be registered.

Make sure to go over the Jasmine documentation at http://jasmine.github.io/2.4/introduction.html to get an idea of all the functionality supported. In addition to what Jasmine offers, this app patches the Jasmine functions so they support `async` functions as well. Asynchronous exceptions are properly caught and displayed too. See `tests/Contacts.js` for an example of using `async/await` in a test context. This is important for us because basically most of the SDK's functionality is asynchronous.

One neat thing is that you can focus to certain subtrees of test using `f.describe` or `f.it` and the other tests are skipped. If you do this on a local instance of the app code and send the link to someone, they will run that test. Then you can change the test and have them refresh to see the changes. This way you can debug things on someone else's device, isolate the issue and maybe even fix it live (if it is a pure JS bug).
