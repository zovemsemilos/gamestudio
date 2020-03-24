const getCart = async (manager, token) => {
  const {socket, db} = manager

  try {
    const {email} = await manager.verifyToken(token)
    const cartProducts = await db.collection('carts').find({email}).toArray()
    const cart = []

    for (const cartProduct of cartProducts) {
      const {collection, productId} = cartProduct
      const _id = manager.getMongoId(productId)
      const product = await db.collection(collection).findOne({_id})

      if (product) {
        cart.push({
          _id: product._id,
          name: product.name,
          collection: product.collection,
          price: product.price,
          discount: product.discount,
          isInStock: product.isInStock,
          image: product.media.heroImage,
          qty: cartProduct.qty
        })
      } else {
        await db.collection('carts').deleteOne({productId})
      }
    }

    socket.emit('getCartRes', cart)
  } catch (err) {
    console.error(err)
  }
}

module.exports = getCart