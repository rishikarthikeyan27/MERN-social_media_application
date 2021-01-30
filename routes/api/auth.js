const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); //we are importing that middleware function not file
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator/check');
const config = require('config');
//Once we get the token, we are going to make a call to our database
router.get('/', auth, async (req, res)=> {
    try{
        const user = await User.findById(req.user.id).select('-password') //select('-password') => So that we can display everything else except password
        //user now contains everything about the user. As in everything that we defined in the model
        res.json(user); 
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error')
    }
}) 

//@route    POST api/auth
//@desc     Login user
//@access   Public

router.post('/',[
    //creating checks for each field
    check('email', 'Please include a valid email')
    .isEmail(),
    check('password', 'Password is required')
    .exists()

], async (req, res)=> {

    const errors = validationResult(req);
    console.log(errors);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    
    const { email, password } = req.body;

    try{

        //see if user already exists
        let user = await User.findOne({ email });

        if(!user){
            return res.status(400).json({errors : [{msg : 'Invalid Credentials'}]});
        }

        //password => Plain text password coming in through req body and user.password that has been retrieved from the database
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({errors : [{msg : 'Invalid Credentials'}]});
        }


        const payload = {
            user:{
                id: user.id
            }
        }
        
        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000},
            (err, token) => {
                if(err) throw err;
                res.json( { token } )
            }); 

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    }
);

module.exports = router;