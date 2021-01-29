const express = require('express');
const connectDB = require('./config/db')

const app = express();

//Connect Database
connectDB(); // remember this is a function


//Init Middleware
app.use(express.json({extended:false})) //gets executed no matter what url has been hit, since you didn't provide any url

app.get('/', (req, res) => res.send('API running'))

//Define Routes
app.use('/api/users', require('./routes/api/users'))
app.use('/api/profile', require('./routes/api/profile'))
app.use('/api/posts', require('./routes/api/posts'))
app.use('/api/auth', require('./routes/api/auth'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> console.log(`Server started on port ${PORT}`));