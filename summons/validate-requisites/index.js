module.exports = (refs, reqs) => {
    for (let i = 0; i < refs.length; i++) {
        if (!reqs[i])
            return {
                valid: false,
                err: refs[i].message ?
                    refs[i].message : refs[i].placeholder
            }

        if (refs[i].validator && reqs[i].replace(
            new RegExp(refs[i].validator), ''))
                return {
                    valid: false,
                    err: refs[i].message ?
                    refs[i].message : refs[i].placeholder
                }
    }

    return { valid: true }
}