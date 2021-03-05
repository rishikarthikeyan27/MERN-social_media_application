const jwt = require('jsonwebtoken');
const config = require('config');

//here we are just going to export a middleware function which has the request response object available to it
module.exports = function(req, res, next){

    //Get token from the header
    const token = req.header('x-auth-token');

    //Check if no token 
    if(!token){
        return res.status(401).json({msg:"No token, authorization denied"})
    }

    //verify token
    try{
        const decoded = jwt.verify(token, config.get('jwtSecret')); //Decoding the token to get the following => {user:{id : ##}, iat: ##, exp: ##}
        
        console.log('This is what has been decoded \n', decoded);
        req.user = decoded.user; // We are saving the user id sent by the x-auth-token into req.user
        next(); //so that the callback function can be executed
    }
    catch(err){
        res.status(401).json({msg: 'Token is not valid'})
    }
} 
