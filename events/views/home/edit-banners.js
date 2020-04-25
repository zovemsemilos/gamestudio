const editBanners = async (manager, data) => {
  const {io, socket, db} = manager
  const {token, banners} = data

  try {
    if (await manager.verifyAdmin(token)) {
      await db.collection('banners').deleteMany({})

      banners.forEach(async (banner) => {
        const {src} = banner

        if (src) {
          await db.collection('banners').insertOne({src})
        }
      })

      io.emit('editBannersRes', banners)
      socket.emit('matDialogClose')
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = editBanners