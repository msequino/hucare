var winston = require("winston");
var winstonGraylog = require('winston-graylog2');

var log = new (winston.Logger)({
  exitOnError: false,
  transports: [
    new (winstonGraylog)({
      name: 'graylog-info',
      //filename: __dirname + '/../tmp/info.log',
      level: 'info',
      graylog : {
        servers: [{ host: "172.17.0.4", port: 12202}]
      }
    }),
    new (winstonGraylog)({
      name: 'graylog-error',
      //filename: __dirname + '/../tmp/error.log',
      level: 'error',
      graylog : {
        servers: [{ host: "172.17.0.4", port: 12202}]
      }
    }),
    new (winston.transports.File)({
      name: 'file-error',
      filename: __dirname + '/../tmp/error.log',
      level: 'error',

    }),
    new (winstonGraylog)({
      name: 'graylog-debug',
      //filename: __dirname + '/../tmp/debug.log',
      level: 'debug',
      graylog : {
        servers: [{ host: "172.17.0.4", port: 12202}]
      }

    })

  ]
});
log.error( "prova")
log.error( "prova")

module.exports = log;
