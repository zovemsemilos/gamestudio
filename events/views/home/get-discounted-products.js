const getDiscountedProducts = async (manager) => {
  const {socket, db} = manager

  try {
    const collections = await manager.getProductCollections()
    const discountedProducts = []

    for (const collection of collections) {
      const products = await db.collection(collection).find({
        discount: {$gt: 1}
      }).toArray()

      if (products) {
        discountedProducts.push(...products)
      }
    }

    socket.emit('getDiscountedProductsRes', discountedProducts)
  } catch (err) {
    console.error(err)
  }
}

module.exports = getDiscountedProducts