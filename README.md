kivi
====

Reusable lib for reporting key/value pairs to the server with [jQuery](http://jquery.com/).

# Design Rational
We want to measure things like:

- Speed of events, such as page load time, asset download time, widget rendering time, etc... See [Yerf](https://github.com/johnsetzer/yerf).
- Browser cache hit ratios
- User actions

This library was designed to be the common transport layer for tools that want to
collect data and report back to the server, so data from all our users could be aggregated. key/value pairs were chosen because they can be injected into nearly any
tool with very little effort. 

At present this library does not let you resubmit a
given key more than once because we feel replaying of event data is of little value in our current use cases. 
kivi was originally specified with the ability to report back to the server on a fixed interval for an indefinite period.  In retrospect, this was a mistake, and this ability has been removed.

All tools being built to use kivi are going to follow
a period separated key convention, which will yield keys roughly in the pattern `TOOL_NAME.TOOL_KEY_HIERARCHY`.
One such key might be: `yerf.delta.pageLoad.widgetLoad`

#Usage

Store a key/value pair

    kivi.set('key', 10);

Get a key/value pair you have stored

    kivi.get('key');

Does some basic setup so kivi knows where to send your data

    kivi.config.postUrl = 'http://localhost:3001/postUrl'
    kivi.config.$ = $;
    
Manual post data to your server

    kivi.post();

Automatically post data after 2000ms, 4000ms after that, and 8000ms after that.

    kivi.enablePost([2000, 4000, 8000]);

You probably only want to collect data from a small fraction of users.

    var REPORT_THRESHOLD = 0.01;
    if (Math.random() < REPORT_THRESHOLD) {
      kivi.enablePost([2000, 4000, 8000]);
    }

Disable automatic posting

    kivi.disablePost();

#Setup

    git clone git@github.com:johnsetzer/kivi.git
    cd kivi
    npm install
    npm install -g jake
    npm install -g testem

#Build minified kivi

    jake build

#Run example

    jake server
    Open http://localhost:3001/example.html

#Run tests

    jake server
    http://localhost:3001/tests/test_suite.html

#Run tests with testem

    testem

#Advanced Config
- If your server does't like the format kivi posts data to the server in, override the `kivi.postData()` method.
- `kivi.onError()` is fired on runtime errors, such as trying to set the same key more than once.  It defaults to logging errors, but you can override it.

        kivi.onError = function(error) {
          if (window.console && window.console.log) {
            window.console.log(error.message);
          }
        }

#Browser Compatibility
kivi is tested in IE 7-10, latest Chrome, latest Firefox, and latests Safari

Older browsers, IE7, don't support `JSON.stringify()`. Kivi prefers to use `JSON.stringify()`, but it will fall back on [jquery.json](https://code.google.com/p/jquery-json/) if `JSON.stringify()` is missing and jquery.json is present on the page. You can set your own JSON library by overriding `kivi.getToJSON()`.

#License
Kivi is licensed under the Apache Version 2.0 License.

http://www.apache.org/licenses/LICENSE-2.0.html

Kivi inlines a snippet of the [Underscore](http://underscorejs.org/) library which is licensed under the MIT license.