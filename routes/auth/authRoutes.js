const express = require('express');
const { registerUser, loginUser, logInCheck, logout } = require('../../controllers/auth/authController');
const verifyTokenData = require('../../middlewares/verifyTokenData');
const allowRoles = require('../../middlewares/allowRoles');


const router = express.Router();

//管理員用
    //註冊會員
    router.post('/register', registerUser);

    //會員登入
    router.post('/login', loginUser);  

    //確認登入
    router.post('/logInCheck', verifyTokenData, allowRoles('admin'), logInCheck);

    //登出
    router.post('/logout', verifyTokenData, logout);
//管理員用

module.exports = router;
