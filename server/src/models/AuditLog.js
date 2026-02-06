const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'move', 'invite']
    },
    entityType: {
        type: String,
        required: true,
        enum: ['Board', 'List', 'Card', 'Member']
    },
    entityId: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }, // Additional context
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: false
});

// Index for efficient querying
auditLogSchema.index({ board: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
