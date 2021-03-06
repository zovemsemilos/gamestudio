/**
 * @param {SocketIO.Socket} socket
 */
const getEditBanners = async (server) => {
  const { socket, db } = server

  try {
    const banners = await db.collection('banners').find().toArray()
    socket.emit('getEditBannersRes', banners)
  } catch (err) {
    console.error(err.message)
  }
}

module.exports = getEditBanners