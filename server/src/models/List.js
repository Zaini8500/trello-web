const mongoose = require('mongoose');

const listSchema = mongoose.Schema({
    title: { type: String, required: true },
    order: { type: Number, required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('List', listSchema);
