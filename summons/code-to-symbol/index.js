module.exports = (code) => {
    switch (code) {
        case 'RUB': return '₽'
        case 'ETH': return 'Ξ'
        case 'BTC': return '฿'
        case 'EUR': return '€'
        case 'USD': return '$'
        default: return '¤'
    }
}