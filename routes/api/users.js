const express = require('express');
const router = express.Router();
const { check, validationResult} = require('express-validator/check')
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

], (req, res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    else{
        res.send("Success")
        return res.status(200)   
    }
    // See if user exists

    // Get users Gravatar

    //Encrypt the password using bcrypt

    //Return jsonwebtoken

});

module.exports = router;