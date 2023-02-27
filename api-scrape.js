const axios = require("axios");
const baseSiteUrl = "https://apiv7.northladder.com/as/category/active-list";
const fs = require("fs");
const request = async (params) => {
  const { url, method, data } = params;
  try {
    const config = {
      method,
      url,
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        // "if-none-match": 'W/"26d8-TMHvc1ZnZYsD4DEVSDhrczYTdFg"',
        "sec-ch-ua":
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-api-key":
          "PUT87HAOLP3AMF1EDGMW:CLS87670402F1F788SSS222367B8F76E3F1104A7DCF3LOI2F1580D83EF014232EA05EXX",
        Referer: "https://www.northladder.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      data,
    };
    const result = await axios(config);
    if (method === "POST") {
      // console.log(result?.data?.data);
      return result?.data?.data;
    }
    return result?.data?.data;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const getIds = async (
  assetId,
  attrValueKey,
  attrValueValue,
  result,
  packetToSend,
  url
) => {
  const attrPacket = [{ key: attrValueKey, value: attrValueValue }];
  const { categoryName, brandName, assetName } = packetToSend;
  const newValues = [categoryName, brandName, assetName, attrValueValue];
  const recursion = async (attrPacketNew, newValues) => {
    try {
      const assetInformation = await request({
        url: `${url}/as/assets/active-asset-attributes/${assetId}`,
        method: "POST",
        data: {
          attributes: attrPacketNew,
        },
      });
      if (assetInformation?.assetInfo?._id) {
        let finalPacketToSend = {
          ...packetToSend,
          assetId: assetInformation?.assetInfo?._id,
        };
        const consolidatedData = await request({
          url: `${url}/cs/appraisal/consolidated-freequote`,
          method: "POST",
          data: finalPacketToSend,
        });
        const lengthOfNewValues = newValues.length;
        console.log(lengthOfNewValues);
        const value = consolidatedData?.quote[0]?.sellAmount;
        let nestedObj = result;
        for (let i = 0; i < newValues.length; i++) {
          let key = newValues[i];
          if (!(key in nestedObj)) {
            nestedObj[key] = {};
          }
          if (i === newValues.length - 1) {
            nestedObj[key] = value;
          }
          nestedObj = nestedObj[key];
        }
        // result = nestedObj;
      } else {
        let originalNewValues = newValues;
        for (let value of assetInformation?.attributes?.values) {
          // Find the index of the object to be replaced
          const newObject = {
            key: assetInformation?.attributes?.key,
            value: value,
          };
          let index = attrPacketNew.findIndex(
            (obj) => obj.key === newObject.key
          );
          let indexValue = newValues.findIndex((val) => val === value);
          // If the object exists, remove it and add the new object
          if (index !== -1) {
            attrPacketNew.splice(index, 1, newObject);
          } else {
            attrPacketNew.push(newObject);
          }
          // if (indexValue !== -1) {
          //   newValues.splice(index, 1, value);
          // } else {
          //   newValues.push(value);
          // }
          await recursion([...attrPacketNew], [...originalNewValues, value]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  await recursion(attrPacket, newValues);
  return result;
};
const apiScrape = async (url) => {
  try {
    console.log("🚀 ~ file: api-scrape.js:14 ~ apiScrape ~ url:", url);
    let result = {};
    const activeList = await request({
      url: `${url}/as/category/active-list`,
      method: "get",
      data: {},
    });
    for (let active of activeList) {
      const categoryId = active?._id;
      const categoryName = active?.categoryName;
      const categoryType = active?.type;
      console.log({ categoryId, categoryName, categoryType });
      result[categoryName] = {};
      const brands = active?.brands;
      for (let brand of brands) {
        const brandName = brand?.name;
        if (brandName === "Apple") {
          continue;
        }
        if (brandName === "Samsung") {
          continue;
        }
        result[categoryName][brandName] = {};
        const brandId = brand?._id;
        console.log({ brandName, brandId });
        const assetList = await request({
          url: `${url}/as/assets/active-groups/${categoryId}/${brandId}`,
          method: "GET",
        });
        for (let asset of assetList) {
          const assetId = asset?._id;
          const assetName = asset?.name;
          result[categoryName][brandName][assetName] = {};
          console.log({ assetId, assetName });
          const attrList = await request({
            url: `${url}/as/assets/active-asset-attributes/${assetId}`,
            method: "POST",
            data: { attributes: [] },
          });
          const attrValueKey = attrList.attributes.key;
          const attrListValuesList = attrList.attributes.values;
          console.log({ attrValueKey });
          for (let attr of attrListValuesList) {
            const attrValueValue = attr;
            let packetToSend = {
              email: "support@northladder.com",
              buyBackTimeStamp: "2023-02-26",
              isSellAsset: true,
              categoryType,
              categoryName,
              assetName,
              brandId,
              brandName,
              categoryId,
              categoryType,
            };
            // result[categoryName][brandName][assetName][attrValueName] = {};
            result = await getIds(
              assetId,
              attrValueKey,
              attrValueValue,
              { ...result },
              { ...packetToSend },
              url
            );
            console.log("check result", JSON.stringify(result));
          }
        }
        console.log("check result final", JSON.stringify(result));
        fs.writeFile(`${brandName}.json`, JSON.stringify(result), (error) => {
          console.log(error);
        });
        result = {};
        result[categoryName] = {};
      }
    }
    return result;
  } catch (error) {
    console.error(error);
  }
};

const url = "https://apiv7.northladder.com";
const main = async () => {
  let finalResult = await apiScrape(url);
  console.log(JSON.stringify(finalResult));
  finalResult = JSON.stringify(finalResult);
  fs.writeFile("result.json", finalResult, (error) => {
    console.log(error);
  });
};
main();
