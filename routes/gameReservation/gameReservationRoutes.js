const express = require("express");
const router = express.Router();
const verifyTokenData = require("../../middlewares/verifyTokenData");
const allowRoles = require("../../middlewares/allowRoles");

const { getAllGameReservations,
        getSingleGameReservation,
        createGameReservation,
        updateGameReservation,
        deleteGameReservation } = require("../../controllers/gameReservation/gameReservationController");



//前端網站用

    // 上傳預約資料
    router.post("/addSingleData", createGameReservation);

//前端網站用

//管理員網站用

    // 取得所有預約資料
    router.get("/getAllData", verifyTokenData, allowRoles('admin'), getAllGameReservations);

    // 取得單一預約資料
    router.get("/getSingleData/:id", verifyTokenData, allowRoles("admin"), getSingleGameReservation);

    // 修改預約資料
    router.put("/changeSingleData/:id", verifyTokenData, allowRoles("admin"), updateGameReservation);

    // 刪除預約資料
    router.delete("/deleteSingleData/:id", verifyTokenData, allowRoles("admin"), deleteGameReservation);

//管理員網站用


module.exports = router;
