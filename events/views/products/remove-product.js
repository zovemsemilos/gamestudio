const removeProduct = async (manager, data) => {
  const {io, socket, db, mongodb} = manager
  const {token, dbCollection, productId} = data

  try {
    if (await manager.verifyAdmin(token)) {
      const _id = mongodb.ObjectId(productId)
      const {value} = await db.collection(dbCollection).findOneAndDelete({_id})

      io.emit('removeProductRes', value)
      socket.emit('matDialogClose')
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = removeProduct