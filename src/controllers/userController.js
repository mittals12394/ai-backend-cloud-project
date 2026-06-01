const userService = require('../services/userService');

// Create
const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Get all
const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// Get by ID
const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Update
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Delete
const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
};