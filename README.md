[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg?style=flat)](https://github.com/fidtech-dev/ucertify-sdk)
[![Build Status](https://img.shields.io/travis/fidtech-dev/ucertify-sdk/master.svg)](https://travis-ci.org/fidtech-dev/ucertify-sdk/)
[![Coverage Status](https://coveralls.io/repos/github/fidtech-dev/ucertify-sdk/badge.svg?branch=master)](https://coveralls.io/github/fidtech-dev/ucertify-sdk?branch=master)
[![NPM Version](https://img.shields.io/npm/v/fidtech-dev.svg)](http://npmjs.com/package/universal-certifier)
[![Downloads](https://img.shields.io/npm/dt/fidtech-dev.svg)](http://npmjs.com/package/universal-certifier)


# Universal certifier SDK module

* [Install](#install)

## Install

```
$ npm install universal-certifier
```

### Promises and Callbacks support

All methods support promises and callbacks.:

```javascript
var it = uc.getAccessToken ();

it.then (
    function (accessToken) {
        console.log (accessToken);
    },
    function (error) {
        console.log (error);
    });
```
is the same as:

```javascript
uc.getAccessToken(function (err, accessToken){
    if (err) {
        console.log (err);
    } else {
        console.log (accessToken);
    }
});
```

In order to use callbacks, simply pass a function as the last parameter.

## Configuration



```javascript
var UC = require ("universal-certifier");

var uc = new UC ("CLIENT_ID", "CLIENT_SECRET");
```

### Certifications

TODO