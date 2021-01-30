const express = require('express');
const router = express.Router();
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')

const { check, validationResult} = require('express-validator/check')

const User = require('../../models/User') //we are importing the model so now we have 

//@route    POST api/users
//@desc     Register user
//@access   Public

router.post('/',[
    //creating checks for each field
    check('name', 'Name is required')
    .not()
    .isEmpty(),
    check('email', 'Please include a valid email')
    .isEmail(),
    check('password', 'Please enter a password with six or more characters')
    .isLength({min:6})

], async (req, res)=> {

    const errors = validationResult(req);
    console.log(errors);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    
    const { name, email, password } = req.body;
    console.log({ name, email, password })

    try{

        //see if user already exists
        let user = await User.findOne({ email });

        if(user){
            return res.status(400).json({errors : [{msg : 'User already exists'}]});
        }

        // Get users Gravatar and store it in a variable called Avatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        //new input for the model
        user = new User({
            name, 
            email,
            password,
            avatar
        });

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        console.log(user.password)

        await user.save();

        //Notice how we are sending the id of a user as a payload by putting the id's value in an object for user
        //This is what will be decoded
        // {
        //     user: { id: '60153d9e513e5b38e53917c2' },
        //     iat: 1612004766,
        //     exp: 1612364766
        //   }

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