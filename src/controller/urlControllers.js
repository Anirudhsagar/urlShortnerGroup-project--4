const urlModel = require("../models/urlModel");
const shortId = require("shortId");
// const axios = require("axios");
const url = require("validator")
const validator = require("../validation/validation");

// const isValidBody = function (x) {
//     return object.key(x).length > 0;
// };

// const isValid = function (x) {
//     if (typeof x === "undefined" || x === null) return false;
//     if (typeof x === "string" && x.trim().length === 0) return false;
//     return true;
// }

// const urlShortener = async (req,res)=> {
//     try {
//         if (!isValidBody(req.body)) return res.status(400).send({ status: false, message: "provide the long Url in the body."})

//         let longUrl = req.body.longUrl
//         if (!isValid(longUrl)) return res.status(400).send({ status: false, message: "Provide the longUrl in the body"})

//         let found = false;
//         await axios
//         .get(longUrl)
//         .then((response)=> {
//             if (response.status == 200 || response .status == 201) found = true
//         })
//         .catch((error) => {})

//         if (found == false) return res.status(400).send({ status: false, message: "Enter a valid URl."})

//         let urlPresent  = await urlModel.findOne( { longUrl: longUrl}).select({ createdAt: 0, updatedAt:0, _v:0, _id:0})
//         if (urlPresent) return res.status(200).send({ status: true, message: "urlCode is already generate for this URL.", data: urlPresent})

//         let urlCode = shortId.generate(longUrl).toLowercase()
//         let shortUrl = `http://localhost:3000/${urlCode}`

//         data.urlCode = urlCode
//         data.shortUrl = shortUrl

//         let savedData = await urlModel.create(data)
//        return res.status(201).send({status : true , data : {longUrl:savedData.longUrl , shortUrl: savedData.shortUrl,urlCode: savedData.urlCode } })

//         // let data = { longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode };

//         // let urlGenerated = await urlModel.create(data);
//         // let result = { longUrl: urlGenerated.longUrl.shortUrl: urlGenerated.shortUrl,}
//     } catch (error) {
//       return res.status(500).send({status : false, message: error.message})

//     }
// }

const urlShortener = async function (req, res) {
  try {
    let data = req.body;
    if (!validator.isValidRequestBody(data)) {
      return res
        .status(400)
        .send({ status: false, message: "please fill empty body" });
    }
    if (!data.longUrl) {
      return res
        .status(400)
        .send({
          status: false,
          message: "invalid URL format",
        });
    }
    if (!validator.isValid(data.longUrl)) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please give long url.",
        });
    }

    //------------ for Long URL

    if (!url.isURL(data.longUrl)) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please Provide correct input for url",
        });
    }

    //---------duplicate long URL
    let duplicateUrl = await urlModel
      .findOne({ longUrl: data.longUrl })
      .select({ urlCode: 1, longUrl: 1, shortUrl: 1, _id: 0 });
    if (duplicateUrl) {
      return res.status(200).send({ status: true, data: duplicateUrl });
    }

    const urlCode = shortId.generate();
    const shortUrl = `http://localhost:3000/${urlCode}`;

    data.urlCode = urlCode;
    data.shortUrl = shortUrl;

    let savedData = await urlModel.create(data);

    return res.status(201).send({
      status: true,
      data: {
        longUrl: savedData.longUrl,
        shortUrl: savedData.shortUrl,
        urlCode: savedData.urlCode,
      },
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { urlShortener };
