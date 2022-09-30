const urlModel = require("../models/urlModel");
const shortId = require("shortId");
// const axios = require("axios");
const url = require("validator")
const validator = require("../validation/validation");


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



const getUrlcode = async function (res,req){
try {
    let data = req.param.urlCode
    if(!validator.isValidRequestBody(data))
    return res.status(400).send({status : false , msg : "please give value in the param"})
     if(!shortId.isValid(data)){
      return res.status(400).send({status : false , msg : "Invalid Urlcode "})

     
     

  }
} catch (err) {
  return res.status(500).send({ status: false, message: err.message });
}  
}
// ### GET /:urlCode
// - Redirect to the original URL corresponding
// - Use a valid HTTP status code meant for a redirection scenario.
// - Return a suitable error for a url not found
// - Return HTTP status 400 for an invalid request
module.exports = { urlShortener ,getUrlcode};
