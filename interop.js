global.summon = (name) => {
    return require(__dirname + '/summons/' + name)
}

global.model = (name) => {
    return require(__dirname + '/models/' + name)
}