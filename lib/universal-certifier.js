"use strict";

var p = require("../package"),
	request = require ("request"),
	Q = require ("q");

var config = {
	API_BASE_URL: "https://ucertify.",
	MIME_JSON: "application/json",
	MIME_FORM: "application/x-www-form-urlencoded"
};

function UniversalCertifierError(message, status) {
	this.name = "UniversalCertifierError";
	this.message = message || "Universal certifier Unknown error";
	this.stack = (new Error()).stack;
	this.status = status || 500;
}

UniversalCertifierError.prototype = Object.create(Error.prototype);
UniversalCertifierError.prototype.constructor = UniversalCertifierError;

var UC = function () {
	var __llAccessToken,
		__clientId,
		__clientSecret,
		__sandbox = false;

	if (arguments.length > 2 || arguments.length < 1) {
		throw new UniversalCertifierError("Invalid arguments. Use CLIENT_ID and CLIENT SECRET, or ACCESS_TOKEN", 400);
	}

	if (arguments.length == 1) {
		__llAccessToken = arguments[0];
	}

	if (arguments.length == 2) {
		__clientId = arguments[0];
		__clientSecret = arguments[1];
	}

	// Instance creation
	var uc = {};

    /**
     * Switch or get Sandbox Mode for Basic Checkout
     */
	uc.sandboxMode = function (enable) {
		if (enable !== null && enable !== undefined) {
			__sandbox = enable === true;
		}

		return __sandbox;
	};

    /**
     * Get Access Token for API use
     */
	uc.getAccessToken = function () {
		var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
		var deferred = Q.defer();

		if (__llAccessToken) {
			next && next(null, __llAccessToken);
			deferred.resolve (__llAccessToken);
		} else {
			UCRestClient.post({
				"uri": "/oauth/token",
				"data": {
					"client_id": __clientId,
					"client_secret": __clientSecret,
					"grant_type": "client_credentials"
				},
				"headers": {
					"Content-type": config.MIME_FORM
				}
			}).then (
				function success (data) {
					next && next(null, data.response.access_token);
					deferred.resolve (data.response.access_token);
				},
				function error (err) {
					next && next(err);
					deferred.reject (err);
				}
			);
		}

		return deferred.promise;
	};

	/**
	Generic resource get
	@param req
	@param params (deprecated)
	@param authenticate = true (deprecated)
	*/
	uc.get = function (req) {
		var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
		var deferred = Q.defer();

		if (typeof req == "string") {
			req = {
				"uri": req,
				"params": arguments[1],
				"authenticate": arguments[2]
			};
		}

		req.authenticate = req.authenticate !== false;

		var auth = Q.Promise(function(resolve, reject) {
			if (req.authenticate) {
				resolve(uc.getAccessToken());
			} else {
				resolve();
			}
		});

		auth.then(function success(at) {
			if (at) {
				req.params || (req.params = {});
				req.params.access_token = at;
			}

			UCRestClient.get(req).then (
				function success (data) {
					next && next(null, data);
					deferred.resolve (data);
				},
				function error (err) {
					next && next(err);
					deferred.reject (err);
				}
			);
		},
		deferred.reject);

		return deferred.promise;
	};

	/**
	Generic resource post
	@param req
	@param data (deprecated)
	@param params (deprecated)
	*/
	uc.post = function (req) {
		var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
		var deferred = Q.defer();

		if (typeof req == "string") {
			req = {
				"uri": req,
				"data": arguments[1],
				"params": arguments[2]
			};
		}

		req.authenticate = req.authenticate !== false;

		var auth = Q.Promise(function(resolve, reject) {
			if (req.authenticate) {
				resolve(uc.getAccessToken());
			} else {
				resolve();
			}
		});

		auth.then(function success(at) {
			if (at) {
				req.params || (req.params = {});
				req.params.access_token = at;
			}

			UCRestClient.post(req).then (
				function success (data) {
					next && next(null, data);
					deferred.resolve (data);
				},
				function error (err) {
					next && next(err);
					deferred.reject (err);
				}
			);
		},
		deferred.reject);

		return deferred.promise;
	};

	/**
	Generic resource put
	@param req
	@param data (deprecated)
	@param params (deprecated)
	*/
	uc.put = function (req) {
		var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
		var deferred = Q.defer();

		if (typeof req == "string") {
			req = {
				"uri": req,
				"data": arguments[1],
				"params": arguments[2]
			};
		}

		req.authenticate = req.authenticate !== false;

		var auth = Q.Promise(function(resolve, reject) {
			if (req.authenticate) {
				resolve(uc.getAccessToken());
			} else {
				resolve();
			}
		});

		auth.then(function success(at) {
			if (at) {
				req.params || (req.params = {});
				req.params.access_token = at;
			}

			UCRestClient.put(req).then (
				function success (data) {
					next && next(null, data);
					deferred.resolve (data);
				},
				function error (err) {
					next && next(err);
					deferred.reject (err);
				}
			);
		},
		deferred.reject);

		return deferred.promise;
	};

	/**
	Generic resource delete
	@param req
	@param params (deprecated)
	*/
	uc.delete = function (req) {
		var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
		var deferred = Q.defer();

		if (typeof req == "string") {
			req = {
				"uri": req,
				"params": arguments[1]
			};
		}

		req.authenticate = req.authenticate !== false;

		var auth = Q.Promise(function(resolve, reject) {
			if (req.authenticate) {
				resolve(uc.getAccessToken());
			} else {
				resolve();
			}
		});

		auth.then(function success(at) {
			if (at) {
				req.params || (req.params = {});
				req.params.access_token = at;
			}

			UCRestClient.delete(req).then (
				function success (data) {
					next && next(null, data);
					deferred.resolve (data);
				},
				function error (err) {
					next && next(err);
					deferred.reject (err);
				}
			);
		},
		deferred.reject);

		return deferred.promise;
	};

	// Backward compatibility
	/**
	Create a certification
	@param preference
	@return json
	*/
	uc.createPreference = function (certification){
		var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

		return uc.post ({
			"uri": "/certifications",
			"data": certification
		}, next);
	};

	/**
	get a  certification
	@param id
	@param preference
	@return json
	*/

	uc.getCertification = function (hashId) {
		var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

		return uc.get ({
			"uri": "/certifications/"+hashId
		},next);
	};



UC.version = p.version;

// /*************************************************************************/

var UCRestClient = (function() {
	function buildRequest (req) {
		var request = {};

		request.uri = config.API_BASE_URL + req.uri;
		request.method = req.method || "GET";

		req.headers || (req.headers = {});

		request.headers = {			
			"user-agent": "Universal certifier Node.js SDK v"+UC.version,
			"accept": config.MIME_JSON,
			"content-type": config.MIME_JSON
		};
		Object.keys(req.headers).map(function (h) {
			request.headers[h.toLowerCase()] = req.headers[h];
		});

		if (req.data) {
			if (request.headers["content-type"] == config.MIME_JSON) {
				request.json = req.data;
			} else {
				request.form = req.data;
			}
		}

		if (req.params) {
			request.qs = req.params;
		}

		request.strictSSL = true;

		return request;
	}

	function exec (req) {
		var deferred = Q.defer();

		req = buildRequest(req);

		request(req, function(error, response, body) {
			if (error) {
				deferred.reject (new UniversalCertifierError(error));
			} else if (response.statusCode < 200 || response.statusCode >= 300) {
				deferred.reject (new UniversalCertifierError(body ? body.message || body : "Unknown", response.statusCode));
			} else {
				try {
					(typeof body == "string") && (body = JSON.parse(body));
				} catch (e) {
					deferred.reject(new UniversalCertifierError ("Bad response"));
				}

				deferred.resolve ({
					"status": response.statusCode,
					"response": body
				});
			}
		});

		return deferred.promise;

	}

	// Instance creation
	var restclient = {};

	restclient.get = function (req) {
		req.method = "GET";

		return exec(req);
	};

	restclient.post = function (req) {
		req.method = "POST";

		return exec(req);
	};

	restclient.put = function (req) {
		req.method = "PUT";

		return exec(req);
	};

	restclient.delete = function (req) {
		req.method = "DELETE";

		return exec(req);
	};

	return restclient;
})();

module.exports = UC;
module.exports.MercadoPagoError = UniversalCertifierError;