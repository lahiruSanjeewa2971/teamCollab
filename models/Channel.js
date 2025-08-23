import mongoose from 'mongoose';

const ChannelSchema = new mongoose.Schema(
  {
    teamId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Team', 
      required: true, 
      index: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    }, // slug used in URLs, displayed as #name
    nameLower: { 
      type: String, 
      required: true, 
      lowercase: true, 
      index: true 
    },
    displayName: { 
      type: String, 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true, 
      maxlength: 300 
    },
    type: { 
      type: String, 
      enum: ['public', 'private'], 
      default: 'public' 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    members: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
  },
  { timestamps: true }
);

// Compound unique index on (teamId, nameLower) to guarantee channel-name uniqueness within a team
ChannelSchema.index({ teamId: 1, nameLower: 1 }, { unique: true });

// Index for efficient member queries
ChannelSchema.index({ 'members.userId': 1 });

// Pre-save middleware to ensure nameLower is always set from name
ChannelSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.nameLower = this.name.toLowerCase();
  }
  next();
});

// Pre-update middleware for findOneAndUpdate operations
ChannelSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.nameLower = update.name.toLowerCase();
  }
  next();
});

export default mongoose.model('Channel', ChannelSchema);
