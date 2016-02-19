Introduction
============

Web sauce is a chrome extension for adding custom CSS and JavaScript to web
pages.

Building
========

For building, run:

   $ bash build.sh

For building in development mode, run:

   $ bash build.sh develop

This will result in `dist/WebSauce-develop` directory.

TODO
====

* [DONE] Ability to add custom CSS and JavaScript to a web page by its hostname.
* [DONE] Implement wildcards for hostnames.
* [DONE] Switch to pageAction.
* [DONE] Add hooks on webRequest.
* Implement whitelist.
* Add ability to blacklist a hostname from popup.
* Add ability to block cookies.

License
=======

See LICENSE file.