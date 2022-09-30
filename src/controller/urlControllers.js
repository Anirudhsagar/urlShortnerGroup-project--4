const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const axios = require("axios");
const url = require("validator");
const validator = require("../validation/validation");


const urlShortener = async function (req, res) {
  try {
    let data1 = req.body;
    let longUrl = req.body.longUrl;
  
    if (!validator.isValid(longUrl))
      return res
        .status(400)
        .send({ status: false, message: "Provide the longUrl in the body." });
    if (!validator.isValid(longUrl))
      return res
        .status(400)
        .send({ status: false, message: "Provide the longUrl in the body." });

    let found = false;

    await axios
      .get(longUrl)
      .then((response) => {
        if (response.status == 200 || response.status == 201) found = true;
        if (!url.isUrl(data1.longUrl))
          return res
            .status(400)
            .send({ status: false, message: "Enter a valid URL." });
      })

      .catch((error) => {});

    let urlPresent = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 });
    if (urlPresent)
      return res.status(200).send({
        status: true,
        message: "urlCode is already generated for this URL.",
        data: urlPresent,
      });

    let urlCode = shortid.generate(longUrl);
    let shortUrl = "http://localhost:3000/" + urlCode;
    obj = {
      longUrl: longUrl,

      urlCode: urlCode,
      shortUrl: shortUrl,
    };

    let data = { longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode };

    let urlGenerated = await urlModel.create(data);
    let result = {
      longUrl: urlGenerated.longUrl,
      shortUrl: urlGenerated.shortUrl,
      urlCode: urlGenerated.urlCode,
    };
    return res.status(201).send({ status: true, data: result });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};



const getUrlcode = async function (req,res){
try {
  let data = req.params.urlCode
    if(!shortid.isValid(data)){
    return res.status(400).send({status : false , msg : "please give value in the param"})}
    //  if(!shortid.isValid(data)){
    //   return res.status(400).send({status : false , msg : "Invalid Urlcode "})}
      let Urlcodefound = await urlModel.findOne({urlCode:data})
      if(!Urlcodefound){
        return res.status(404).send({status : false , msg : "UrlCode is not found"})
      }
      return res.status(302).redirect(Urlcodefound.longUrl)

} catch (error) {
  res.status(500).send({status : false , msg : error.message})
}
}


// ### GET /:urlCode
// - Redirect to the original URL corresponding
// - Use a valid HTTP status code meant for a redirection scenario.
// - Return a suitable error for a url not found
// - Return HTTP status 400 for an invalid request
module.exports = { urlShortener ,getUrlcode};
