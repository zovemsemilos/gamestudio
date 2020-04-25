const getProducts = async (manager, dbCollection) => {
  const {socket, db} = manager

  try {
    const products = await db
      .collection(dbCollection)
      .find()
      //.skip(0)
      //.limit(20)
      .toArray()

    //console.log(products) // TODOOO

    socket.emit('getProductsRes', products)
  } catch (err) {
    console.error(err)
  }
}

module.exports = getProducts