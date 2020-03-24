const increaseQty = async (manager, data) => {
  const {socket, db} = manager
  const {token, productId} = data

  try {
    const {email} = await manager.verifyToken(token)

    if (email) {
      await db.collection('carts').updateOne(
        {$and: [{email}, {productId}]},
        {$inc: {qty: 1}}
      )
  
      socket.emit('increaseQtyRes', productId)
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = increaseQty