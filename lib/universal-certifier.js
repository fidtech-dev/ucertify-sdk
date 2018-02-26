const crypto = require('crypto');
const fs = require('fs');
const p = require('../package');
const request = require('request');
const Q = require('q');

const config = {
  API_BASE_URL: 'http://localhsost:5000',
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
  let clientId;
  let clientSecret;
  let sandbox = false;


  if (arguments.length > 2 || arguments.length < 1) {
    throw new UniversalCertifierError('Invalid arguments. Use CLIENT_ID and CLIENT SECRET', 400);
  }

  if (arguments.length === 2) {
    clientId = arguments[0];
    clientSecret = arguments[1];
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
    // console.log('Encrypting ', arguments[1], ' with secret ', clientSecret);

    const localSignature = crypto.createHmac('sha1', clientSecret);
    const encodeText = JSON.stringify(arguments[1], null, 0);

    localSignature.update(encodeText);
    const calculatedSignature = `sha1=${localSignature.digest('hex')}`;
    req.headers = {
      'u-cert-api-key': clientId,
      'u-cert-signature': calculatedSignature,
    };

    req.authenticate = req.authenticate !== false;

    const auth = Q.Promise((resolve, reject) => {
      if (req.authenticate) {
        resolve(uc.getAccessToken());
      } else {
        resolve();
      }
    });

    // console.log('Executing get with req ', req);

    UCRestClient.get(req).then(
      (data) => {
        console.log('data',data);
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
    // console.log('Encrypting ', JSON.stringify(toSign, null, 0), ' with secret ', clientSecret);
    localSignature.update(JSON.stringify(toSign, null, 0));
    const calculatedSignature = `sha1=${localSignature.digest('hex')}`;
    req.headers = {
      'u-cert-api-key': clientId,
      'u-cert-signature': calculatedSignature,
    };

    req.authenticate = req.authenticate !== false;

    console.log('**** COntacting UCRestClient');

    UCRestClient.post(req).then (
      function success (data) {
        console.log('Success..', data)
        next && next( data);
        deferred.resolve (data);
      },
      function error (err) {
        console.log('Error..')
        next && next(null,err);
        deferred.reject (err);
      }
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
    // console.log('getting certification');
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
  uc.certify = function (fileUrl) {
    const next = typeof (arguments[arguments.length - 1]) === 'function' ? arguments[arguments.length - 1] : null;

    console.log('Posting certification');
    return uc.post(
      {
        uri: '/certifier/certify',
        fileUrl,
        formData: {
          certifyThis: fs.createReadStream(fileUrl),
        },
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
    // console.log('executing req', req);

    request(req, (error, response, body) => {
       console.log('Finished request, informing ');
      console.log('Error ',error);
      console.log('Body ',body);



      if (error) {
        deferred.reject(new UniversalCertifierError(error));
      } else if (response.statusCode < 200 || response.statusCode >= 300) {
        deferred.reject(new UniversalCertifierError(body ? body.message || body : 'Unknown', response.statusCode));
      }
      else {
        console.log('No error.. ',response.statusCode);
        try {
          (typeof body === 'string') && (body = JSON.parse(body));
        } catch (e) {
          console.log('Catching.. ',e);

          deferred.reject(new UniversalCertifierError('Bad response'));
        }
        console.log('Resolving.. ', body);

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
	  // console.log('restclient recieved req ', req);
    req.method = 'GET';

    return exec(req);
  };

  restclient.post = function (req) {
    req.method = 'POST';
    console.log('Executing post in UCRestClient')
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
