const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
//@route    GET api/profile
//@desc     Get current users profile
//@access   Private (Hence the middleware auth will be used)

router.get('/me', auth, async (req, res)=>{
    try{
        const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name', 'avatar']);

        if(!profile){
            res.status(400).json({msg: 'There is no profile for this user'});
        }

        res.json(profile);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;