const mongodb = require('mongodb')

/**
 * @param {SocketIO.Socket} socket
 * @param {Object} data
 * @param {string} data.collection
 * @param {string} data.productId
 */
const getProduct = async (server, data) => {
  const { socket, db } = server
  const { collection, productId } = data
  const _id = mongodb.ObjectId(productId)

  try {
    const product = await db.collection(collection).findOne({ _id })
    socket.emit('getProductRes', product)
  } catch (err) {
    console.error(err.message)
  }
}

module.exports = getProduct