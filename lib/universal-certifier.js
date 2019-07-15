/* eslint-disable prefer-rest-params */
const crypto = require('crypto');
const fs = require('fs');
const request = require('request');
const Q = require('q');
const debug = require('debug')('info');
const p = require('../package');

const config = {
  API_BASE_URL: process.env.UCERT_API_URL,
  MIME_JSON: 'application/json',
  MIME_FORM: 'application/x-www-form-urlencoded',
};

function UniversalCertifierError(message, status) {
  this.name = 'UniversalCertifierError';
  this.message = message || 'Universal certifier Unknown error';
  this.stack = (new Error()).stack;
  this.status = status || 500;
}

UniversalCertifierError.prototype = Object.create(Error.prototype);
UniversalCertifierError.prototype.constructor = UniversalCertifierError;

const UC = function () {
  if (!process.env.UCERT_API_URL) throw new Error('Missing API URL, configure UCERT_API_URL environment variable');

  let clientId;
  let clientSecret;
  let sandbox = false;


  if (arguments.length > 3 || arguments.length < 2) {
    throw new UniversalCertifierError('Invalid arguments. Use CLIENT_ID and CLIENT SECRET', 400);
  }

  if (arguments.length === 2) {
    [clientId, clientSecret] = arguments;
  }

  if (arguments.length === 3) {
    [clientId,, clientSecret] = arguments;
    sandbox = arguments[1] || false;
  }


  // Instance creation
  const uc = {};

  /**
   * Switch or get Sandbox Mode for Basic Checkout
   */
  uc.sandboxMode = function (enable) {
    if (enable !== null && enable !== undefined) {
      sandbox = enable === true;
    }
    return sandbox;
  };


  /**
   Generic resource get
   @param req
   @param params (deprecated)
   @param authenticate = true (deprecated)
   */
  uc.get = function (req) {
    const next = typeof (arguments[arguments.length - 1]) === 'function' ? arguments[arguments.length - 1] : null;
    const deferred = Q.defer();

    // noinspection JSAnnotator
    if (typeof req === 'string') {
      req = {
        uri: req,
        params: arguments[1],
      };
    }
    // debug('Encrypting ', arguments[1], ' with secret ', clientSecret);

    const localSignature = crypto.createHmac('sha1', clientSecret);
    const encodeText = JSON.stringify(arguments[1], null, 0);

    localSignature.update(encodeText);
    const calculatedSignature = `sha1=${localSignature.digest('hex')}`;
    req.headers = {
      'u-cert-api-key': clientId,
      'u-cert-signature': calculatedSignature,
      sandbox,
    };

    req.authenticate = req.authenticate !== false;

    const auth = Q.Promise((resolve, reject) => {
      if (req.authenticate) {
        resolve(uc.getAccessToken());
      } else {
        resolve();
      }
    });

    // debug('Executing get with req ', req);

    UCRestClient.get(req).then(
      (data) => {
        debug('data', data);
        next && next(null, data);
        deferred.resolve(data);
      },
      (err) => {
        next && next(err);
        deferred.reject(err);
      },
    );


    return deferred.promise;
  };

  /**
   Generic resource post
   @param req
   @param data (deprecated)
   @param params (deprecated)
   */
  uc.post = function (req) {
    const next = typeof (arguments[arguments.length - 1]) === 'function' ? arguments[arguments.length - 1] : null;
    const deferred = Q.defer();

    if (typeof req === 'string') {
      req = {
        uri: req,
        data: arguments[1],
        params: arguments[2],
      };
    }
    const localSignature = crypto.createHmac('sha1', clientSecret);
    const toSign = fs.readFileSync(req.fileUrl);
    // debug('Encrypting ', JSON.stringify(toSign, null, 0), ' with secret ', clientSecret);
    localSignature.update(JSON.stringify(toSign, null, 0));
    const calculatedSignature = `sha1=${localSignature.digest('hex')}`;
    req.headers = {
      'u-cert-api-key': clientId,
      'u-cert-signature': calculatedSignature,
      sandbox,
    };

    req.authenticate = req.authenticate !== false;

    debug('**** Contacting UCRestClient');

    UCRestClient.post(req).then(
      (data) => {
        debug('Success..', data);
        next && next(data);
        deferred.resolve(data);
      },
      (err) => {
        debug('Error..');
        next && next(null, err);
        deferred.reject(err);
      },
    );

    return deferred.promise;
  };

  /**
   get a  certification
   @param id
   @param preference
   @return json
   */
  uc.getCertification = function (hashId) {
    const next = typeof (arguments[arguments.length - 1]) === 'function' ? arguments[arguments.length - 1] : null;
    // debug('getting certification');
    return uc.get(
      { uri: `/certifier/${hashId}` },
      hashId,
      next,
    );
  };


  /**
   generat a  certification
   @param id
   @param preference
   @return json
   */
  uc.certify = function (links) {
    const next = typeof (arguments[arguments.length - 1]) === 'function' ? arguments[arguments.length - 1] : null;
    if (typeof links !== 'object') throw new UniversalCertifierError('Wrong parameters, data must be an array of links');
    if (!links || !links.length || links.length === 0) throw new UniversalCertifierError('Wrong parameters, missing payload');
    links.forEach(*())
    debug('Posting certification');
    return uc.post(
      {
        uri: '/certifier/certify',
        body: links,
      },
      next,
    );
  };

  return uc;
};


UC.version = p.version;

// /*************************************************************************/

var UCRestClient = (function () {
  function buildRequest(req) {
    const request = {};

    request.uri = config.API_BASE_URL + req.uri;
    request.method = req.method || 'GET';
    if (req.formData) request.formData = req.formData;

    req.headers || (req.headers = {});

    request.headers = {
      'user-agent': `Universal certifier Node.js SDK v${UC.version}`,
      accept: config.MIME_JSON,
      'content-type': config.MIME_JSON,
    };

    Object.keys(req.headers).map((h) => {
      request.headers[h.toLowerCase()] = req.headers[h];
    });

    if (req.data) {
      if (request.headers['content-type'] === config.MIME_JSON) {
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

  function exec(req) {
    const deferred = Q.defer();

    req = buildRequest(req);
    // debug('executing req', req);

    request(req, (error, response, body) => {
      debug('Finished request, informing ');
      debug('Error ', error);
      debug('Body ', body);


      if (error) {
        deferred.reject(new UniversalCertifierError(error));
      } else if (response.statusCode < 200 || response.statusCode >= 300) {
        deferred.reject(new UniversalCertifierError(body ? body.message || body : 'Unknown', response.statusCode));
      } else {
        debug('No error.. ', response.statusCode);
        try {
          (typeof body === 'string') && (body = JSON.parse(body));
        } catch (e) {
          debug('Catching.. ', e);

          deferred.reject(new UniversalCertifierError('Bad response'));
        }
        debug('Resolving.. ', body);

        deferred.resolve({
          status: response.statusCode,
          response: body,
        });
      }
    });

    return deferred.promise;
  }

  // Instance creation
  const restclient = {};

  restclient.get = function (req) {
	  // debug('restclient recieved req ', req);
    req.method = 'GET';

    return exec(req);
  };

  restclient.post = function (req) {
    req.method = 'POST';
    debug(`Executing post in UCRestClient to${process.env.UCERT_API_URL}`);
    return exec(req);
  };

  restclient.put = function (req) {
    req.method = 'PUT';

    return exec(req);
  };

  restclient.delete = function (req) {
    req.method = 'DELETE';

    return exec(req);
  };

  return restclient;
}());

module.exports = UC;
module.exports.UniversalCertifierError = UniversalCertifierError;
