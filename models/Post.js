const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    text:{
        type: String,
        required: true
    },
    name:{
        type:String
    },
    avatar: {
        type: String
    },
    likes:[ //Because there will be an array of users who will like a post
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            }
        }
    ],
    comments:[
        {
            user:{
                type: Schema.Types.ObjectId,
                ref: 'users'
            },
            text:{
                type:String,
                required:true
            },
            name: {
                type: String
            },
            avatar: {
                type: String
            },
            date:{
                type: Date,
                default: Date.now
            }
        }
    ],
    date:{
        type: Date,
        default: Date.now
    }
});

module.exports = Post = mongoose.model('post', PostSchema)