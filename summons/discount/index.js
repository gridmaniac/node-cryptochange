module.exports = x => {
    if (x => x >= 0 && x < 300) return 0.05
    if (x => x >= 300 && x < 500) return 0.06
    if (x => x >= 500 && x < 1000) return 0.07
    if (x => x >= 1000 && x < 2000) return 0.08
    if (x => x >= 2000 && x < 3000) return 0.09
    if (x => x >= 3000 && x < 5000) return 0.1
    if (x => x >= 5000 && x < 10000) return 0.11
    if (x => x >= 10000 && x < 20000) return 0.12
    if (x => x >= 20000 && x < 40000) return 0.15
    if (x => x >= 40000) return 0.2
}
