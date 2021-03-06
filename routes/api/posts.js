const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route   POST api/posts
//@desc    Create a post
//@access  Private (auth middleware)

router.post('/', [ 
    auth,  
    [
        check('text', 'Text is required')
            .not()
            .isEmpty()
    ]
],
async (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name : user.name,
            avatar : user.avatar,
            user: req.user.id
        });
        const post = await newPost.save(); // We can send this variable as a response
        res.json(post);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');   
    }

    

})

//@route   GET api/posts
//@desc    Get all posts
//@access  Private (auth middleware)

router.get('/', auth, async (req, res) => {
    try {

        const posts = await Post.find().sort({ date : -1 }); //We add the negative 1 so that it can come from most recent to old
        res.json(posts);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

//@route   GET api/posts/:id
//@desc    Get post by ID
//@access  Private (auth middleware)

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({msg:'Post not found'})
        }
        res.json(post);

    } catch (err) {
        console.error(err.message);
        if(err.kind=='ObjectId') {
            return res.status(404).json({msg:'Post not found'})
        }
        res.status(500).send('Server Error');
    }
})

//@route   DELETE api/posts/:id
//@desc    Delete a post by ID
//@access  Private (auth middleware)

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        //Check post
        if(!post) {
            return res.status(404).json({msg:'Post not found'})
        }

        if(post.user.toString() != req.user.id){ 
            return res.status(401).json({msg : 'User not authorized'})
        }
        await post.remove();

        res.json({msg : 'Post removed'});

    } catch (err) {
        console.error(err.message);
        if(err.kind=='ObjectId') {
            return res.status(404).json({msg:'Post not found'})
        }
        res.status(500).send('Server Error');
    }
})


//@route   PUT api/posts/like
//@desc    Like a post by ID
//@access  Private (auth middleware)

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); //So that we can get the post
        
        //Check post
        if(!post) {
            return res.status(404).json({msg:'Post not found'})
        }

        //Check if post has been already liked
        const rocket = post.likes.filter(like => like.user.toString() === req.user.id);
        
        if(post.likes.filter(like => like.user.toString() === req.user.id).length>0){
            return res.status(400).json({msg : 'Post already liked'})
        }
        post.likes.unshift({ user : req.user.id });
        await post.save();
        
        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        if(err.kind=='ObjectId') {
            return res.status(404).json({msg:'Post not found'})
        }
        res.status(500).send('Server Error');
    }
})

//@route   PUT api/posts/unlike/:id
//@desc    Unlike a post by ID
//@access  Private (auth middleware)

router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); //So that we can get the post
        
        //Check post
        if(!post) {
            return res.status(404).json({msg:'Post not found'})
        }

        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
            res.status(400).json({msg: 'Post has not been liked yet'})
        }

        //Get removeIndex
        const removeIndex = post.likes
            .map(like => like.user.toString()) //A new array with each element being the result of the callback function. So here it gives an array of item IDS
            .indexOf(req.user.id);
        console.log(post.likes.map(like=> like.user.toString()))

        //Check if post has been liked (Because you cannot unlike a post that you have not liked)
        post.likes.splice(removeIndex, 1);

        await post.save();
        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        if(err.kind=='ObjectId') {
            return res.status(404).json({msg:'Post not found'})
        }
        res.status(500).send('Server Error');
    }
})

//@route   PUT api/posts/comment/:id
//@desc    Add a comment to the post
//@access  Private (auth middleware)

router.put('/comment/:id', [ 
    auth,  
    [
        check('text', 'Text is required')
            .not()
            .isEmpty()
    ]
],
async (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id); //So that we can get the post
        const newComment = {
            text: req.body.text,
            name : user.name,
            avatar : user.avatar,
            user: req.user.id
        };
        post.comments.unshift(newComment);
        await post.save();

        res.json(post.comments);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');   
    }
})

//@route   DELETE api/posts/comment/:postid/:comment_id
//@desc    Delete comment by commentID
//@access  Private (auth middleware)

router.delete('/comment/:id/:comment_id', auth, async (req, res)=> {
    
    try {
        const post = await Post.findById(req.params.id); //So that we can get the post

        //Pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        console.log(comment)

        //Make sure comment exists
        if(!comment){
            return res.status(404).json({msg : 'Comment does not exist'});
        }

        //Make sure user deleting comment is the one who made the comment
        //Check user
        if(comment.user.toString() != req.user.id){
            return res.status(401).json({msg : 'User not authorized'})
        }

        //Get removeIndex
        const removeIndex = post.comments
            .map(like => comment.user.toString()) //A new array with each element being the result of the callback function. So here it gives an array of item IDS
            .indexOf(req.user.id);
        console.log(post.comments.map(comment=> comment.user.toString()))
        post.comments.splice(removeIndex,1)
        await post.save();
        res.json(post.comments);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');   
    }
})


module.exports = router;