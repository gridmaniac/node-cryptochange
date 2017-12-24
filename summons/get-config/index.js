const log = summon('log')(module),
      yaml = require('js-yaml'),
      fs = require('fs')

module.exports = async () => {
    try {
        return new Promise((resolve, reject) => {
            fs.readFile('config.yml', 'utf8', (err, file) => {
                if (err) reject(err)

                const config = yaml.safeLoad(file)
                resolve(config)
            })
        })
    } catch(e) {
        log.error(e)
    }
}