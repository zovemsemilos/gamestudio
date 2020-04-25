const addToCart = async (manager, data) => {
  const {socket, db} = manager
  const {token, dbCollection, productId} = data

  try {
    const {email} = await manager.verifyToken(token)

    if (email) {
      const product = await db
      .collection('carts')
      .findOne({$and: [{email}, {productId}]})

      if (product) {
        socket.emit('addToCartRes', 'Ovaj proizvod ste već dodali u korpu')
      } else {
        await db.collection('carts').insertOne({
          email,
          collection: dbCollection,
          productId,
          qty: 1
        })

        socket.emit('addToCartRes', 'Proizvod je dodat u korpu')
      }
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = addToCart