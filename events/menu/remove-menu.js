const removeMenu = async (manager, data) => {
  const {io, socket, db, mongodb} = manager
  const {token, menuId} = data
  
  try {
    if (await manager.verifyAdmin(token)) {
      const _id = mongodb.ObjectId(menuId)

      await db.collection('menus').deleteOne({_id})

      io.emit('removeMenuRes', menuId)
      socket.emit('matDialogClose')
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = removeMenu