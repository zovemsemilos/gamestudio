const editBanners = async (manager, banners) => {
  const {io, socket, db} = manager

  try {
    await db.collection('banners').deleteMany({})

    for (const banner of banners) {
      await db.collection('banners').insertOne({src: banner})
    }

    io.emit('editBannersRes', banners)
    socket.emit('matDialogClose')
  } catch (err) {
    console.error(err)
  }
}

module.exports = editBanners