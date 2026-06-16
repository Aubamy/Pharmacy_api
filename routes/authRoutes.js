const router = require('express').Router();

const {
    register,
    login,
    logout,
    getProfile,
    editProfile,
    getMe
} = require('../controllers/authController');

const auth = require('../middleware/auth');

router.post('/register', register);

router.post('/login', login);

router.post('/logout', logout);

router.get('/profile', auth, getProfile);

router.put('/edit-profile', auth, editProfile);

router.get('/me', auth, getMe);

module.exports = router;