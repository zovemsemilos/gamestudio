const removeMenu = async (manager, data) => {
  const {io, socket, db} = manager
  const {token, menuId} = data
  
  try {
    if (await manager.verifyAdmin(token)) {
      const _id = manager.getMongoId(menuId)

      await db.collection('menus').deleteOne({_id})

      io.emit('removeMenuRes', menuId)
      socket.emit('matDialogClose')
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = removeMenu