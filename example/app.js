const UC = require('../lib/universal-certifier');
const config = require('./config');

const uc = new UC(config.apiKey, config.secret);
uc.certify(
  './example/testfile.jpg',
  true,
  (res, err) => {
    if (err) throw err;
    console.log('res');
    console.log(res);

    // Getting the posted certification back
    if (res) {
      uc.getCertification(
        res.id, (innerRes) => {
          console.log('Getting back the certification ');
          console.log(innerRes);
        },
        (innerError) => {
          console.log(innerError);
        },
      );
    }
  },
);

