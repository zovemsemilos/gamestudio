const login = async (manager, data) => {
  const {socket, db} = manager
  const {email, password, stayLoggedIn} = data

  try {
    const account = await db.collection('accounts').findOne({email})

    if (account) {
      const verified = await manager.verifyPassword(password, account.password)

      if (verified) {
        const {_id, role} = account
        const id = _id.toHexString()
        const options = stayLoggedIn ? {expiresIn: '1d'} : {expiresIn: '1h'}
        const token = manager.signToken(id, options)
        const msg = 'Dobrodošli'

        socket.emit('loginRes', {token, role, msg})
      } else {
        socket.emit('loginRes', {msg: 'Pogrešna lozinka'})
      }
    } else {
      socket.emit('loginRes', {msg: 'E-mail ne postoji'})
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = login