const winston = require('winston')

module.exports = (module) => {
    const tsFormat = () => {
        const date = new Date()
        return date.toLocaleDateString()
            + ' ' + date.toLocaleTimeString()
    },
          path = module.filename.split('\\').slice(-2).join('\\')
          
    return new (winston.Logger)({
        transports: [
            new (winston.transports.File)({
                    filename: 'log/crashes.log',
                    level: 'error',
                    json: false,
                    timestamp: tsFormat,
                    label: path
                })
        ]
    })
}
