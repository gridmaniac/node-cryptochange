let active = true

this.get = () => {
    return active
}

this.switch = () => {
    active = !active
}

module.exports = this