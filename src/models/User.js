const mongoose = require('mongoose');

if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid user ID"
  });
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);