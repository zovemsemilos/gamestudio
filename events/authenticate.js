const authenticate = async (manager, token) => {
  const {socket} = manager

  try {
    const {role} = await manager.verifyToken(token)

    if (role) {
      socket.emit('authenticateRes', role)
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = authenticate