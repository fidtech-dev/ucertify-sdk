var UC = require('../lib/universal-certifier')

var uc = new UC("<Your_API_Key>","<Your_Secret>");

uc.getCertification("<CertificationID>", function (res,err) {
  console.log('res:',res);
  console.log('err', err);
});

