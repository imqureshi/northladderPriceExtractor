const {
  Scraper,
  Root,
  DownloadContent,
  OpenLinks,
  CollectContent,
} = require("nodejs-web-scraper");

const scrapeWeb = async (url) => {
  let result = {};
  const config = {
    baseSiteUrl: url,
    startUrl: url,
    filePath: "./images/",
    concurrency: 10, //Maximum concurrent jobs. More than 10 is not recommended.Default is 3.
    maxRetries: 3, //The scraper will try to repeat a failed request few times(excluding 404). Default is 5.
    logPath: "./logs/", //Highly recommended: Creates a friendly JSON for each operation object, with all the relevant data.
  };
  counter = 0;

  getElementContent = (elem) => {
    console.log({ elem });
    const keys = Object.keys(result);
    if (keys === [] || counter > 0) result[elem] = {};
    else {
      for (const key of keys) {
        if (result[key] == {}) {
          result[key][elem] = {};
        }
      }
    }
  };
  const scraper = new Scraper(config);
  const root = new Root();
  const title = new CollectContent(".s1.s2-lg.s3-md", {
    getElementContent,
  });
  counter += 1;
  const links = new OpenLinks(
    ".box-design.devices-box-design.text-center.pt-2.pt-lg-4.pt-xl-6.pb-5.pb-sm-7.pb-md-5.pb-lg-7.d-flex.justify-content-between.align-items-center",
    {
      name: "links",
    }
  );
  const brand = new CollectContent(
    ".custom-brand-item.md:nl-widget-w-[152px].sm:nl-widget-w-[98px].nl-widget-h-[86px].md:nl-widget-mb-6.sm:nl-widget-mb-3.nl-widget-flex.nl-widget-flex-col.nl-widget-items-center.nl-widget-justify-center.nl-widget-border.nl-widget-rounded-xl",
    {
      getElementContent,
    }
  );
  const images = new CollectContent(".ant-image-img");
  root.addOperation(title);
  root.addOperation(links);
  links.addOperation(images);
  await scraper.scrape(root);
  console.log({ result });
};
scrapeWeb("https://www.northladder.com");
