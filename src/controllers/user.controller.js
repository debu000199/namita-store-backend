export const me = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      message: 'User fetched successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.log('Error happen while fetching user: ', error.message);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};
