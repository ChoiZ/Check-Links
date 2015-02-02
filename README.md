# check-links
Check a page links (error 404, 500) thanks to casperjs

== Requirements ==

* casperjs
* PhantomJS or SlimerJS

== Usage ==

    casperjs test check-links.js --includes=URI.js --url=http://localhost:4000

Change the `url` param by the url you want to check.
