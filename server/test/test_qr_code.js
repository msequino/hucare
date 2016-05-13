var expect = require('expect.js'),
 patient = require("../controllers/patient.js"),
 fs        = require("fs");

describe('QrCode', function(){
  it('should create qr code file with patient name data', function(){
    return patient.createQRCode({'patient' : '123'}).then(function(data){
      expect(data).to.be.a('number');
    });

/*
    ,function(err,url){
      if(err) throw err;
      if(!fs.existsSync(__dirname + "/../qrcodes/123.png"))  throw new Error("File does not exist");
      else{
        fs.unlink(__dirname + "/../qrcodes/123.png");
        done();
      }
    })*/
  });
});
