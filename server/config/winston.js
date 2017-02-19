var winston = require("winston");

var log = new (winston.Logger)({
  exitOnError: false,
  transports: [
    new (winston.transports.File)({
      name: 'info',
      filename: __dirname + '/../tmp/info.log',
      level: 'info',
    }),
    new (winston.transports.File)({
      name: 'error',
      filename: __dirname + '/../tmp/error.log',
      level: 'error',

    }),
    new (winston.transports.File)({
      name: 'debug',
      filename: __dirname + '/../tmp/debug.log',
      level: 'debug',
    })

  ]
});

module.exports = log;
