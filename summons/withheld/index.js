const Order = model('order')

module.exports = async x => {
    const orders = await Order
        .find({
            $and: [
                { twallet: x },
                { $or: [
                    { status: 0 }, 
                    { status: 1 }, 
                    { status: 2 } 
                ]}
            ]})
        .exec()
    
    let withheld = 0
    for (let order of orders) {
        withheld += order.tsum
    }
    
    return withheld
}