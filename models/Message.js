import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true // Index for performance when querying messages by channel
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for performance when querying messages by sender
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000 // Limit message length for performance and UX
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'link']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  threadMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  isThread: {
    type: Boolean,
    default: false
  },
  threadParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true }
});

// Compound index for efficient channel message queries with pagination
messageSchema.index({ channelId: 1, createdAt: -1 });

// Compound index for sender queries within channels
messageSchema.index({ channelId: 1, senderId: 1, createdAt: -1 });

// Index for search functionality
messageSchema.index({ 
  channelId: 1, 
  content: 'text' 
});

// Index for reply queries
messageSchema.index({ replyTo: 1 });

// Index for thread queries
messageSchema.index({ threadParent: 1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
});

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  const now = new Date();
  const messageDate = this.createdAt;
  
  if (now.toDateString() === messageDate.toDateString()) {
    return 'Today';
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === messageDate.toDateString()) {
    return 'Yesterday';
  }
  
  return messageDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
});

// Virtual for checking if message is recent (within last 24 hours)
messageSchema.virtual('isRecent').get(function() {
  const now = new Date();
  const messageDate = this.createdAt;
  const hoursDiff = (now - messageDate) / (1000 * 60 * 60);
  return hoursDiff < 24;
});

// Virtual for checking if message can be edited (within 15 minutes)
messageSchema.virtual('canEdit').get(function() {
  const now = new Date();
  const messageDate = this.createdAt;
  const minutesDiff = (now - messageDate) / (1000 * 60);
  return minutesDiff <= 15 && !this.deleted;
});

// Virtual for checking if message can be deleted
messageSchema.virtual('canDelete').get(function() {
  return !this.deleted;
});

// Pre-save middleware for content validation
messageSchema.pre('save', function(next) {
  // Ensure content is not empty after trimming
  if (!this.content || this.content.trim().length === 0) {
    return next(new Error('Message content cannot be empty'));
  }
  
  // Update editedAt if content was modified
  if (this.isModified('content') && this.edited) {
    this.editedAt = new Date();
  }
  
  next();
});

// Pre-save middleware for deletion handling
messageSchema.pre('save', function(next) {
  if (this.deleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  next();
});

// Static method to get messages by channel with pagination
messageSchema.statics.getChannelMessages = async function(channelId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({ 
    channelId, 
    deleted: false 
  })
  .populate('senderId', 'username email avatar firstName lastName')
  .populate('replyTo', 'content senderId')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
  
  const total = await this.countDocuments({ 
    channelId, 
    deleted: false 
  });
  
  return {
    messages: messages.reverse(), // Show oldest first for chat UI
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Static method to search messages
messageSchema.statics.searchMessages = async function(channelId, searchTerm, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({
    channelId,
    deleted: false,
    content: { $regex: searchTerm, $options: 'i' }
  })
  .populate('senderId', 'username email avatar firstName lastName')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
  
  const total = await this.countDocuments({
    channelId,
    deleted: false,
    content: { $regex: searchTerm, $options: 'i' }
  });
  
  return {
    messages: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Instance method to soft delete message
messageSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Instance method to restore deleted message
messageSchema.methods.restore = function() {
  this.deleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Instance method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from same user
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ userId, emoji });
  return this.save();
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(r => 
    !(r.userId.toString() === userId.toString() && r.emoji === emoji)
  );
  return this.save();
};

// Instance method to check if user has reacted
messageSchema.methods.hasUserReaction = function(userId, emoji) {
  return this.reactions.some(r => 
    r.userId.toString() === userId.toString() && r.emoji === emoji
  );
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
