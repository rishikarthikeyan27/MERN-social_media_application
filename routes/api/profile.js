const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const { check, validationResult} = require('express-validator')


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

//@route    POST api/profile
//@desc     Create or Update the user profile
//@access   Private (Hence the middleware auth will be used)
router.post('/', [  auth, [

    check('status', 'Status is required')
    .not()
    .isEmpty(),
    check('skills', 'One or more skills are required')
    .not()
    .isEmpty()] 
    ],

    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        //Build Profile Object  --> It is information from this object that will be rendered and shown on our homepage

        const profileFields = {}; //Initializing the profile object
        profileFields.user = req.user.id; //req.user comes from auth middleware
        if(company) profileFields.company = company ;
        if(website) profileFields.website = website ;
        if(location) profileFields.location = location ;
        if(bio) profileFields.bio = bio ;
        if(status) profileFields.status = status ;
        if(githubusername) profileFields.githubusername = githubusername ;
        if(skills) profileFields.skills = skills ;
        if(youtube) profileFields.youtube = youtube ;
        if(facebook) profileFields.facebook = facebook ;
        if(twitter) profileFields.twitter = twitter ;
        if(instagram) profileFields.instagram = instagram ;
        if(linkedin) profileFields.linkedin = linkedin ;
})

module.exports = router;