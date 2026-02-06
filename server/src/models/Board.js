const mongoose = require('mongoose');

const boardSchema = mongoose.Schema({
    title: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Board', boardSchema);
