const mongoose = require('mongoose');

const cardSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    labels: [{
        name: { type: String, required: true },
        color: { type: String, required: true } // hex color code
    }],
    dueDate: { type: Date },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
});

// Index for filtering
cardSchema.index({ list: 1, order: 1 });
cardSchema.index({ 'labels.name': 1 });
cardSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Card', cardSchema);
