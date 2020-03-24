const checkoutApproved = async (manager, data) => {
  const {db} = manager
  const {token, order} = data

  console.log(order)

  try {
    const {email} = await manager.verifyToken(token)
    const orders = await db.collection('orders').findOne({email})

    if (orders) {

    } else {

    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = checkoutApproved