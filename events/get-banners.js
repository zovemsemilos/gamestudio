/**
 * @param {SocketIO.Socket} socket
 */
const getBanners = async (server) => {
  const { socket, db } = server

  try {
    const banners = await db.collection('banners').find().toArray()
    socket.emit('getBannersRes', banners)
  } catch (err) {
    console.error(err.message)
  }
}

module.exports = getBanners