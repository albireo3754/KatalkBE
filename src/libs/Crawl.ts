import csv from 'csv-parser';
import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { parse } from 'node-html-parser';
import path from 'path';
import { config } from 'dotenv';
config();
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

function isActivatedID(LP: string) {
  if (LP.match('Ch') || LP.match('Diamond I') || LP.match('aster')) {
    return true;
  }
  return false;
}

async function getSummonerV4(summonerName: string) {
  // summonerName : [KR] 이름~
  const [rawCountry, rawName] = summonerName.split('] ');
  const name = encodeURIComponent(rawName);
  let country;
  if (rawCountry === '[KR') {
    country = 'kr';
  } else {
    country = rawCountry.slice(1).toLowerCase() + '1';
  }
  console.log(
    `https://${country}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${process.env.RIOT}`,
  );
  return await axios.get(
    `https://${country}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${process.env.RIOT}`,
  );
}

async function getSummonerV4test() {
  console.log(await getSummonerV4('[EUW] DWG KIA'));
  console.log(await getSummonerV4('[KR] 쭌 베'));
}

getSummonerV4test();

async function getProNickname() {
  const data = await axios.get('https://www.trackingthepros.com/player/Showmaker/');
  const root = await parse(data.data).querySelectorAll('.table')[1].querySelectorAll('td');
  let i = 0;
  while (i < root.length) {
    if (i & 1) {
      if (isActivatedID(root[i].textContent)) {
        console.log(root[i - 1].innerText);
        const { data } = await getSummonerV4(root[i - 1].innerText);
        console.log(data);
      }
    }
    i++;
  }
  // return root.replace(/.+\s/, '');
}

// getProNickname().then((data) => {
//   console.log(data);
// });
