/**
 * This casper unit test script checks for 404 internal links for a given root url.
 *
 * Author: n1k0, jnankin, ChoiZ
 *
 * Adapted from: https://gist.github.com/n1k0/4509789
 * And Re-adapted from: https://gist.github.com/jnankin/66829583bbcd9d16bb61
 * Usage:
 *
 *     $ casperjs test 404checker.js --includes=URI.js --url=http://localhost:4000
 */

var url = casper.cli.get("url");
var checked = [];
var dead = [];
var currentLink = 0;
var fs = require('fs');
var upTo = 100;
var baseUrl = url;
var links = [url];
var utils = require('utils');
var f = utils.format;
var test;

function absPath(url, base) {
    return new URI(url).resolve(new URI(base)).toString();
}

// Clean links
function cleanLinks(urls, base) {
    return utils.unique(urls).filter(function(url) {
        return url.indexOf(baseUrl) === 0 || !new RegExp('^(#|ftp|javascript|http)').test(url);
    }).map(function(url) {
        return absPath(url, base);
    }).filter(function(url) {
        return checked.indexOf(url) === -1;
    });
}

// Opens the page, perform tests and fetch next links
function crawl(link) {
    this.start().then(function() {
        this.echo(link, 'COMMENT');
        this.open(link);
        checked.push(link);
    });
    this.then(function() {
        test.assertNotEquals(this.currentHTTPStatus, 404, link + ' is missing (HTTP 404)');
        test.assertNotEquals(this.currentHTTPStatus, 500, link + ' is broken (HTTP 500)');

        if (this.currentHTTPStatus === 404) {
            casper.log(link + ' is missing (HTTP 404)', 'warn');
            dead.push(link);
        } else if (this.currentHTTPStatus === 500) {
            casper.log(link + ' is broken (HTTP 500)', 'warn');
            dead.push(link);
        } else {
            casper.log(link + f(' is okay (HTTP %s)', this.currentHTTPStatus), 'debug');
        }
    });
    this.then(function() {
        var newLinks = searchLinks.call(this);
        links = links.concat(newLinks).filter(function(url) {
            return checked.indexOf(url) === -1;
        });
        casper.log(newLinks.length + " new links found on " + link, 'debug');
    });
}

// Fetch all <a> elements from the page and return
// the ones which contains a href starting with 'http://'
function searchLinks() {
    return cleanLinks(this.evaluate(function _fetchInternalLinks() {
        return [].map.call(__utils__.findAll('a[href]'), function(node) {
            return node.getAttribute('href');
        });
    }), this.getCurrentUrl());
}

// As long as it has a next link, and is under the maximum limit, will keep running
function check() {
    if (links[currentLink] && currentLink < upTo) {
        crawl.call(this, links[currentLink]);
        currentLink++;
        this.run(check);
    } else {
	
        casper.log("All done, " + checked.length + " links checked.", 'debug');
        if (fs.exists("deadLinks.log")) fs.remove("deadLinks.log");

        if (dead.length > 0) {
           casper.log("Found " + dead.length + " dead links: ", 'warn');
               for (var i in dead){
                  this.warn(dead[i]);
               }

           fs.write("deadLinks.log", dead.join("\n"));
        }
        test.done();
    }
}

casper.test.begin('Check links', function suite(t) {
    casper.start().then(function() {
        this.echo("Starting");
        test = t;
    }).run(check);
});