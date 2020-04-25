const editMenu = async (manager, data) => {
  const {io, socket, db, mongodb} = manager
  const {token, menu} = data

  try {
    if (await manager.verifyAdmin(token)) {
      const _id = mongodb.ObjectId(menu._id)
      menu._id = _id // menu._id is a string, overwrite it to ObjectId

      const replaced = await db.collection('menus').replaceOne({_id}, menu)

      io.emit('editMenuRes', replaced.ops[0])
      socket.emit('matDialogClose')
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = editMenu