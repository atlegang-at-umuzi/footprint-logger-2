const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  totalEmissions: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update streak method
userSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.lastActivityDate) {
    this.streak = 1;
  } else {
    const lastActivity = new Date(this.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    
    const daysDiff = (today - lastActivity) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 1) {
      this.streak += 1;
    } else if (daysDiff > 1) {
      this.streak = 1;
    }
    // If daysDiff === 0, keep current streak
  }
  
  this.lastActivityDate = new Date();
};

module.exports = mongoose.model('User', userSchema);