const express = require('express');
const router = express.Router();
const request = require('request')
const config = require('config')
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
        if(!errors.isEmpty()){ //basically if there are errors
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
        if(skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim()); //remeber each skill is a string that may contain white spaces
        };

        //Build Social object
        profileFields.social = {}
        if(youtube) profileFields.social.youtube = youtube ; //if the field named youtube has a value, then ...
        if(facebook) profileFields.social.facebook = facebook ;
        if(twitter) profileFields.social.twitter = twitter ;
        if(instagram) profileFields.social.instagram = instagram ;
        if(linkedin) profileFields.social.linkedin = linkedin ;

        try{
            let profile = await Profile.findOne({user: req.user.id}) //Since we are using async await whenever we use a mongoose method we need to await before it
            if(profile){
                //Update
                profile = await Profile.findOneAndUpdate(
                {user : req.user.id}, 
                { $set: profileFields},
                {new:true}
                );

                return res.json(profile)

            }

            //Create
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile)


        }catch(err){
            console.error(err.message);
            res.send(500).send('Server Error')
        }
        
})

//@route    POST api/profile/user/:user_id
//@desc     Get profile by user ID
//@access   Public

router.get('/user/:user_id', async(req, res) =>  {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if(!profile) 
            return res.status(400).json({msg: 'Profile not found'});
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'Object.Id'){
            return res.status(400).json({msg: 'Profile not found'});
        }
        res.status(500).send('Server Error');
    }
})

//@route    DELETE api/profile
//@desc     Delete profile, user & posts
//@access   Private (Hence the middleware auth will be used)

router.delete('/', auth, async (req, res)=>{
    try{
        //@todo - remove users posts

        //Remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //Remove user
        await User.findOneAndRemove({ _id: req.user.id }); // req.user.id will be matched to _id
    
        res.json({ msg : 'User deleted'});
    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

//@route    PUT api/profile/experience
//@desc     Add profile experience
//@access   Private (Hence the middleware auth will be used)

router.put('/experience', [ 
    auth, 
    [
        check('title', 'Title is required')
            .not()
            .isEmpty(),
        check('company', 'Company is required')
            .not()
            .isEmpty(),
        check('from', 'From date is required')
            .not()
            .isEmpty()
        
]], 
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }

        const {
        title,
        company,
        location,
        from,
        to,
        current,
        description 
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({user : req.user.id}); //Remember this is gotten from the auth (Otherwise you will have to signin for every single feauture once you do login )

            await profile.experience.unshift(newExp); //The unshift() method adds one or more elements to the beginning of an array and returns the new length of the array.
            
            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
            
        }
    }

);

//@route    DELETE api/profile/experience/:experience_id
//@desc     Remove profile experience by the experience ID
//@access   Private (Hence the middleware auth will be used)

router.delete('/experience/:exp_id', auth, async(req,res) => {
    try {
        
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.experience
            .map(item => item.id) //A new array with each element being the result of the callback function. So here it gives an array of item IDS
            .indexOf(req.params.exp_id);
        
        console.log(profile.experience.map(item=>item.id));

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error');  
    }
})

//@route    PUT api/profile/education
//@desc     Add profile education
//@access   Private (Hence the middleware auth will be used)

router.put('/education', [ 
    auth, 
    [
        check('school', 'School is required')
            .not()
            .isEmpty(),
        check('degree', 'Degree is required')
            .not()
            .isEmpty(),
        check('fieldofstudy', 'Field of study date is required')
            .not()
            .isEmpty(),
        check('from', 'From date is required')
            .not()
            .isEmpty()
        
    ]
], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user : req.user.id }); //Remember this is gotten from the auth (Otherwise you will have to signin for every single feauture once you do login )

            await profile.education.unshift(newEdu); //The unshift() method adds one or more elements to the beginning of an array and returns the new length of the array.
            
            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
            
        }
    }

);

//@route    DELETE api/profile/education/:edu_id
//@desc     Remove profile education by the education ID
//@access   Private (Hence the middleware auth will be used)

router.delete('/education/:edu_id', auth, async (req,res) => {
    try {
        
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.education
            .map(item => item.id) //A new array with each element being the result of the callback function. So here it gives an array of item IDS
            .indexOf(req.params.edu_id);
        
        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error');  
    }
})

//@route    GET api/profile/education/:edu_id
//@desc     Get user repos from Github by username
//@access   Public 

router.get('/github/:username', (req, res) => {
    try {
        
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method : 'GET',
            headers: {'user-agent' : 'node.js'}
        };

        request(options, (error, response, body) => {
            if(error) console.error(error);
            if(response.statusCode != 200) {
                res.status(404).json({msg: 'No Github profile found'});
            }
            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;