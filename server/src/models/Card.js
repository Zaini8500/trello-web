const mongoose = require('mongoose');

const cardSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional legacy check
    dueDate: { type: Date },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Card', cardSchema);
