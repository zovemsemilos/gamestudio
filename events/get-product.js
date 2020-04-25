const getProduct = async (manager, data) => {
  const {socket, db, mongodb} = manager
  const {dbCollection, productId} = data
  const _id = mongodb.ObjectId(productId)

  try {
    const product = await db.collection(dbCollection).findOne({_id})
    socket.emit('getProductRes', product)
  } catch (err) {
    console.error(err.message)
  }
}

module.exports = getProduct