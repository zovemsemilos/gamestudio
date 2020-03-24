const removeFromCart = async (manager, data) => {
  const {socket, db} = manager
  const {token, productId} = data

  try {
    const {email} = await manager.verifyToken(token)

    if (email) {
      await db.collection('carts').deleteOne(
        {$and: [{email}, {productId}]}
      )

      socket.emit('removeFromCartRes', productId)
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = removeFromCart