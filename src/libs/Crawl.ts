import csv from 'csv-parser';
import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { parse } from 'node-html-parser';
import path from 'path';
interface INickplusID {
  idx: string;
  nickname: string;
  lane: string;
  team: string;
  country: string;
  tier: string;
  name: string;
  accountId: string;
  id: string;
  puuid: string;
}

interface IProID {
  Proname: string;
  Position: string;
  Team: string;
  Country: string;
  Tier: string;
}
function readCSV<T>(url: string) {
  const results: T[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(url)
      .pipe(csv())
      .on('data', (data: T) => {
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      });
  });
}

function readCSVproID(url: string) {
  const results: IProID[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(url)
      .pipe(csv())
      .on('data', (data: IProID) => {
        data = {
          ...data,
          Proname: data.Proname.replace('Follow', ''),
        };
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      });
  });
}

function saveJSON(data: unknown, url: string) {
  const json = JSON.stringify(data);
  fs.writeFileSync(url, json);
}

//csvToJSON()을 하기
async function csvToJSON(name: string) {
  const data = await readCSVproID(path.join(__dirname, `${name}.csv`));
  saveJSON(data, path.join(__dirname, `${name}.json`));
}

// 1. proID만들기
// csvToJSON('proID');

async function getProNickname() {
  const data = await axios.get('https://www.trackingthepros.com/player/Chovy/');
  const root = await parse(data.data).querySelectorAll('.table')[1].querySelector('td').textContent;
  return root.replace(/.+\s/, '');
}

// getProNickname().then((data) => {
//   console.log(data);
// });
