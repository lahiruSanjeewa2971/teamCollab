import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['team_removal', 'team_invite', 'team_update', 'system', 'test']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false
  },
  teamName: {
    type: String,
    required: false
  },
  severity: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  // New fields for duplicate prevention
  actionHash: {
    type: String,
    required: true,
    index: true
  },
  occurrenceCount: {
    type: Number,
    default: 1
  },
  lastOccurrence: {
    type: Date,
    default: Date.now
  },
  // For team removal specific logic
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for duplicate prevention
notificationSchema.index({ userId: 1, actionHash: 1, isDeleted: 1 }, { unique: true });
notificationSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, isDeleted: 1 });
notificationSchema.index({ actionHash: 1, isDeleted: 1 });

// Virtual for formatted timestamp
notificationSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for smart message display
notificationSchema.virtual('smartMessage').get(function() {
  if (this.type === 'team_removal' && this.occurrenceCount > 1) {
    return `${this.message} (${this.occurrenceCount} times)`;
  }
  return this.message;
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
