const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

(async () => {
  
    //Launch the headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://sketchfab.com/search?q=ben+10&sort_by=-publishedAt&type=models', {
    waitUntil: 'networkidle2',
  });
  //specify where the desired content is based on the website's html structure
  await page.waitForSelector('.card-model');

  const data = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card-model'));
    return cards.map(card => {
      const thumbnailLink = card.querySelector('.card-model__thumbnail-link')?.href || null;
      const imageAlt = card.querySelector('.image-container__image')?.alt || null;
      const imageSrc = card.querySelector('.image-container__image')?.src || null;
      return { thumbnailLink, imageAlt, imageSrc };
    });
  });

  
  await browser.close();

  
  fs.writeFileSync('./extract.json', JSON.stringify(data, null, 2));

  
  if (!fs.existsSync('./images')) {
    fs.mkdirSync('./images');
  }

  
  data.sort((a, b) => a.imageAlt.localeCompare(b.imageAlt));

  for (const { imageSrc, imageAlt } of data) {
    const file = fs.createWriteStream(`./images/${imageAlt}.jpeg`);
    https.get(imageSrc, function(response) {
      response.pipe(file);
    });
  }
})();
