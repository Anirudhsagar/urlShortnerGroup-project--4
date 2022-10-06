const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const axios = require("axios");
const redis = require("redis");
const { promisify } = require("util");

// =====================================redis Configuration===================

const redisClient = redis.createClient(
  12500, //port number
  "redis-12500.c301.ap-south-1-1.ec2.cloud.redislabs.com", //end point
  { no_ready_check: true }
);

redisClient.auth("s7qMp9cEotNQchcRNXGhrTYvsXHmN52M", function (err) {
  //password
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


// =============================binding================================

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);

// ================================================creating shorturl=========================

const urlShorter = async function (req, res) {
  try {
    let { longUrl } = req.body;
    let obj = {};
    
    //------------------------------------ validating inout from req.body
    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "please enter valid request input" });
    }

    if (!longUrl) {
      return res
        .status(400)
        .send({ status: false, message: "longUrl is missing" });
      }

//------------------------- checking in cache memory

    let cachedLongUrl = await GET_ASYNC(longUrl);
    
//---------------------------- cache hit case

    if (cachedLongUrl)
      return res.status(201).send({
        status: true,
        message: "Url is already shortened",
        data: JSON.parse(cachedLongUrl),
      });
//---------------------------- cache miss case
    else {
      let found = false;
      await axios
        .get(longUrl)
        .then((response) => {
          if (response.status == 200 || response.status == 201) found = true;
        })
        .catch((err) => {});
        
        if (!found)
        return res
          .status(400)
          .send({ status: "false", message: "Invalid URL" });

// ---------------------------------checking for duplicate longURL
      let checkURL = await urlModel
        .findOne({ longUrl: longUrl })
        .select({ _id: 0, __v: 0 });

//------------------------------- if longURL is not present in collection, creating new data
        if (!checkURL) {
          obj.longUrl = longUrl;
          obj.urlCode = shortid.generate();
          
          obj.shortUrl = "http://localhost:3000/".concat(
            obj.urlCode.toLocaleLowerCase()
            );
            
//------------------------------- creating new data
            await urlModel.create(obj);
            checkURL = await urlModel.findOne(obj).select({ _id: 0, __v: 0 });
          }

//------------------------------------- set expiry for redis
      await SETEX_ASYNC(`${longUrl}`, 10, JSON.stringify(checkURL));
      await SETEX_ASYNC(`${checkURL.urlCode}`, 20, JSON.stringify(checkURL));

      return res
        .status(201)
        .send({ status: true, message: "success", data: checkURL });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, messgae: err.messgae });
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

    let cachedata = await GET_ASYNC(`${req.params.urlCode}`);
    console.log(cachedata);
    if (cachedata) {
      return res.status(302).redirect(cachedata);
    } else {
      let profile = await urlModel.findOne({data});
      
      await SET_ASYNC(`${data}`, (profile.longUrl));
    }
    
    let Urlcodefound = await urlModel.findOne({ urlCode: data });
    if (!Urlcodefound) {
      return res
        .status(404)
        .send({ status: false, msg: "UrlCode is not found" });
    }

    return res.status(302).redirect(Urlcodefound.longUrl);
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

module.exports = { urlShorter, getUrlcode };
