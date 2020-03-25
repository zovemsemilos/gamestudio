const search = async (manager, searchTerm) => {
  const {socket, db} = manager

  try {
    const collections = await manager.getProductCollections()
    const searchProducts = []

    for (const collection of collections) {

      const products = await db.collection(collection).find({
        name: {$regex: `.*${searchTerm}.*`, $options: 'i'}
      }).toArray()

      searchProducts.push(...products)
    }

    socket.emit('searchRes', searchProducts)
  } catch (err) {
    console.error(err)
  }
}

module.exports = search