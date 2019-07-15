const UC = require('../lib/universal-certifier');
const config = require('./config');

const uc = new UC(config.apiKey, config.secret);
const pictures = [
  {
    name: 'picture_0',
    link: 'https://cloudflare-ipfs.com/ipfs/QmUwHMFY9GSiKgjqyZpgAv2LhBrh7GV8rtLuagbry9wmMU',
  },
  {
    name: 'picture_1',
    link: 'https://ipfs.io/ipfs/Qmep61aZqJhhmSkhQHUSUme5RFbi8ZfccxXC1TyjKHcEig',
  },
];

uc.certify(
  pictures,
  true,
  (res, err) => {
    if (err) throw err;
    // Getting the posted certification back
    if (res) {
      console.log('Getting back the certification ');
      console.log(res.response.certificationId)
      uc.getCertification(
        res.response.certificationId, (innerRes) => {
          console.log(innerRes);
        },
        (innerError) => {
          console.log(innerError);
        },
      );
    }
  },
);
