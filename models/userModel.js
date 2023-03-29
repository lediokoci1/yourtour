const mongoose = require('mongoose');
const validator = require('validator');

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    // var below transform email to lowercase
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  name: {
    type: String,
    required: [true, 'A user must have a name.'],
    unique: true,
    trim: true, // removes spaces at the begining and at the end of the string
    // maxlength: [40, 'A user name must have less or equal then 40 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'A user must have a name.'],
    unique: false,
    trim: true, // removes spaces at the begining and at the end of the string
    maxlength: [40, 'A user name must have less or equal then 40 characters'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password.'],
    minlength: [8, 'Password should have at least 8 characters'],
    // make password not visible
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Confirmation Password is not equal with Password!',
    },
    // make password not visible
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // hash or encryption is the same thing
  this.password = await bcrypt.hash(this.password, 12);
  // when we do not want to save the confirmPassword in DB:
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // we do that 1 second decrease because it can cause problems in comparing with iat JWT
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Middleware below is going to be called in every query that includes find in it
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
// instance method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // if token is created before user has changed the password => true
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
