const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
exports.register = async (req, res) => {
    // code from /api/register

    try {
        const schema = Joi.object({
            fullName: Joi.string().min(3).required(),
            email: Joi.string().email().required(),
            phone: Joi.string().min(10).required(),
            password: Joi.string().min(6).required(),
            confirmPassword: Joi.ref('password')
        });

        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const { fullName, email, phone, password } = req.body;

        // check if user exists
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        // create user
        const user = await User.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: 'user'
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (err) {
        console.log(err); //  IMPORTANT
        res.status(500).send(err.message);
    }
};


exports.login = async (req, res) => {
    // code from /api/login

    try {
        const { email, password } = req.body;

        // 1. check if user exists
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // 2. compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // 3. generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            'secretkey123', // later we move to .env
            { expiresIn: '7d' }
        );

        // 4. send response
        res.json({
            message: 'Login successful',
            token
        });

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
};



exports.logout = async (req, res) => {
    // code from /api/logout

    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};

exports.getProfile = async (req, res) => {
    try {
        // req.user.id comes straight from your 'auth' middleware token extraction
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] } // Protect security by keeping the password hidden
        });

        if (!user) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
};

exports.editProfile = async (req, res) => {
    // code from /api/edit-profile

    try {
        const fullName = req.body?.fullName;
        const phone = req.body?.phone;
        const email = req.body?.email;

        const userId = req.user.id;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        await user.update({
            fullName: fullName || user.fullName,
            phone: phone || user.phone,
            email: email || user.email
        });

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
};



exports.getMe = async (req, res) => {
    // code from /me

    try {

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] },
        });

        res.json(user);

    } catch (error) {

        res.status(500).json({
            error: error.message,
        });

    }
}



