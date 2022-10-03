const urlModel = require("../models/urlModel");
const shortid = require("shortid");
// const axios = require("axios");
const validator = require("../validation/validation");

const redis = require("redis");

const { promisify } = require("util");
const { stat } = require("fs");

//Connect to redis
const redisClient = redis.createClient(
  18447,    //port number
  "redis-18447.c212.ap-south-1-1.ec2.cloud.redislabs.com", //end point
  { no_ready_check: true }
);
redisClient.auth("s38aevI8u89pQakUvsUPMdV2Spaw4GoV", function (err) {     //password
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


function checkUrl(url) {
  const reg =
    /^\s*http[s]?:\/\/([a-z]{2,3}\.)?[a-zA-Z0-9]+\.[a-z]{2,3}(\.[a-z]{2})?(\/[\w\-!:@#$%^&*()+=?\.]*)*\s*$/;
  return reg.test(url);
}
const urlShortener = async function (req, res) {
  try {
    let longUrl = req.body.longUrl;

    if (!validator.isValid(longUrl))
      return res
        .status(400)
        .send({ status: false, message: "Provide the longUrl in the body." });

    if (!checkUrl(req.body.longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid URL." });
    }

    let urlPresent = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 });
    if (urlPresent)
      return res.status(200).send({
        status: true,
        message: "urlCode is already generated for this URL.",
        data: urlPresent,
      });

    let urlCode = shortid.generate(longUrl).toLowerCase();
    if ((longUrl)) {
      let cachedUrl = await GET_ASYNC(`${longUrl}`)
      cachedUrl = JSON.parse(cachedUrl)
      if(cachedUrl)    
      return res.status(200).send({ status: true, data: cachedUrl})

      let url = await urlModel.findOne({longUrl}).select({ _id: 0, __v: 0 })

      if (url) {
          await SET_ASYNC(`${longUrl}`, JSON.stringify(url))
          res.status(200).send({ status: true, data: url })
      } else {

          const shortUrl = "http://localhost:3000/" + urlCode

          let url = await urlModel.create({longUrl, shortUrl, urlCode})
          let data = {
              longUrl : url.longUrl,
              shortUrl : url.shortUrl,
              urlCode : url.urlCode
          }

          res.status(201).send({ status: true, data: data })
      }
  }
  else {
      res.status(400).send({ status: false, message: "Invalid longUrl" })
  }
}
catch (error) {
  res.status(500).send({ status: false, message: error.message })
}}
// ======================get API=====================

const getUrlcode = async function (req, res) {
  try {
    let data = req.params.urlCode;
    if (!shortid.isValid(data)) {
      return res
        .status(400)
        .send({ status: false, msg: "please give value in the param" });
    }

    let Urlcodefound = await urlModel.findOne({ urlCode: data });
    if (!Urlcodefound) {
      return res
        .status(404)
        .send({ status: false, msg: "UrlCode is not found" });
    }
    let cachedata = await GET_ASYNC(`${data}`);
    if (cachedata) {
      return res.status(302).redirect(data);
    } else {
      let profile = await urlModel.findOne({ data });
      await SET_ASYNC(`${data}`, JSON.stringify(profile));
    }
    return res.status(302).redirect(Urlcodefound.longUrl);
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

module.exports = { urlShortener, getUrlcode };
