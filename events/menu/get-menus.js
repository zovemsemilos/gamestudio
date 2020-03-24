const getMenus = async (manager) => {
  const {socket, db} = manager

  try {
    const menus = await db.collection('menus').find().toArray()
    socket.emit('getMenusRes', menus)
  } catch (err) {
    console.error(err)
  }
}

module.exports = getMenus