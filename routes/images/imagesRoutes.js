const express = require('express');
const router = express.Router();
const multer = require('multer');
//Node.js 的「檔案接收器」
const upload = multer({ dest: 'temp/' });
//圖片檔案會暫存在temp資料夾中


const { getImages, 
        uploadImage,
        deleteImage, 
        uploadImageChange 
} = require('../../controllers/images/imagesController');

//#region
//#endregion

//#region 取得圖片
router.get('/getImages', getImages);
//#endregion

//upload.single('image')代表只接收一個檔案且formData的名稱必須是image
//接收完成的資訊會放在req.file中
//#region 上傳圖片
router.post('/upload', upload.single('file'), uploadImage);
//#endregion

//#region 修改圖片
router.put('/uploadChange', upload.single('file'), uploadImageChange);
//#endregion

//#region 刪除圖片
router.delete('/deleteImage', deleteImage);
//#endregion

module.exports = router;