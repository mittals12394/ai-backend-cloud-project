const { PrismaClient } = require("@prisma/client");
const User = require("../models/User");
const prisma = new PrismaClient();

const createUser = async (data) => {
  return await User.create(data);
};

const getUsers = async () => {
  return await prisma.user.findMany();
};

const getUserById = async (id) => {
  return await User.findById(id);
};

const updateUser = async (id, data) => {
  return await User.findByIdAndUpdate(id, data, { new: true });
};

const deleteUser = async (id) => {
  return await User.findByIdAndDelete(id);
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
