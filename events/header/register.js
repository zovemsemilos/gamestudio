const register = async (manager, data) => {
  const {socket, db} = manager
  const {email, password} = data

  try {
    const account = await db.collection('accounts').findOne({email})

    if (account) {
      socket.emit('registerRes', {success: false, msg: 'E-mail već postoji'})
    } else {
      const hashedPassword = await manager.hashPassword(password)

      await db.collection('accounts').insertOne({
        email,
        password: hashedPassword,
        role: 'user'
      })

      socket.emit('registerRes', {
        success: true,
        msg: 'Uspešno ste otvorili nalog'
      })
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = register