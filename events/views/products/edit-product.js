const editProduct = async (manager, data) => {
  const {io, socket, db} = manager
  const {token, collection, product} = data

  try {
    if (await manager.verifyAdmin(token)) {
      const _id = manager.getMongoId(product._id)
      product._id = _id

      const replaced = await db.collection(collection).replaceOne(
        { _id }, product
      )

      io.emit('editProductRes', replaced.ops[0])
      socket.emit('matDialogClose')
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = editProduct