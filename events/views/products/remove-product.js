const removeProduct = async (manager, data) => {
  const {io, socket, db} = manager
  const {token, collection, productId} = data

  try {
    if (await manager.verifyAdmin(token)) {
      const _id = manager.getMongoId(productId)

      await db.collection(collection).deleteOne({_id})

      io.emit('removeProductRes', productId)
      socket.emit('matDialogClose')
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = removeProduct