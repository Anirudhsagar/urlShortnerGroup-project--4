const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const axios = require("axios");
const urlId = require("shortid");
const validator = require("../validation/validation");

const redis = require("redis");

const { promisify } = require("util");
const { stat } = require("fs");

//Connect to redis
const redisClient = redis.createClient(
  18447, //port number
  "redis-18447.c212.ap-south-1-1.ec2.cloud.redislabs.com", //end point
  { no_ready_check: true }
);
redisClient.auth("s38aevI8u89pQakUvsUPMdV2Spaw4GoV", function (err) {
  //password
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
const urlShorter = async function (req, res) {
  try {
    let origUrl = req.body.longUrl;

    if (!origUrl) {
      return res
        .status(400)
        .send({ status: false, message: "please fill the body" });
    }

    if (!checkUrl(origUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid URL." });
    }

    let option = {
      method: "get",
      url: origUrl,
    };
    let exist = await axios(option)
      .then(() => origUrl) // Pending and Fulfilled Promise Handling
      .catch(() => null); // Reject Promise Handling

    let isPresent = await urlModel
      .findOne({ longUrl: origUrl })
      .select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 });
    if (isPresent) {
      return res
        .status(200)
        .send({
          status: true,
          message: "short URL is already generated with requested URL",
          data: isPresent,
        });
    }

    let baseUrl = "http://localhost:3000/";
    let urlCode = urlId.generate().toLowerCase();
    let reqUrl = baseUrl + urlCode;

    obj = {
      longUrl: origUrl,
      shortUrl: reqUrl,
      urlCode: urlCode,
    };

    let urlDetails = await urlModel.create(obj);
    return res.status(201).send({ status: true, data: obj });
  } catch (err) {
    return res.status(500).send({ satus: false, messege: err.message });
  }
};
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
      // console.log("from cache");
      return res.status(302).redirect(Urlcodefound.longUrl);
    } else {
      let profile = await urlModel.findOne({ data });
      console.log("from MongoDb");
      await SET_ASYNC(`${data}`, JSON.stringify(profile));
    }
    return res.status(302).redirect(Urlcodefound.longUrl);
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

module.exports = { urlShorter, getUrlcode };
