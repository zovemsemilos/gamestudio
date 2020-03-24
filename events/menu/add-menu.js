const addMenu = async (manager, data) => {
  const {io, socket, db} = manager
  const {token, menu} = data

  try {
    if (await manager.verifyAdmin(token)) {
      const inserted = await db.collection('menus').insertOne(menu)

      io.emit('addMenuRes', inserted.ops[0])
      socket.emit('matDialogClose')
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = addMenu