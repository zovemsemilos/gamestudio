const getProducts = async (manager, collection) => {
  const {socket, db} = manager

  try {
    const products = await db.collection(collection).find().toArray()
    socket.emit('getProductsRes', products)
  } catch (err) {
    console.error(err)
  }
}

module.exports = getProducts