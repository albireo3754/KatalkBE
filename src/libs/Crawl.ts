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
  if (!url.match(/\.json$/)) {
    url += '.json';
  }
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

function getNameAndCountry(summonerName: string) {
  const [rawCountry, rawName] = summonerName.split('] ');
  const name = encodeURIComponent(rawName);
  let country;
  if (rawCountry === '[KR') {
    country = 'kr';
  } else {
    country = rawCountry.slice(1).toLowerCase() + '1';
  }
  return [name, country];
}

async function getSummonerV4({ country, name }: { country: string; name: string }) {
  // summonerName : [KR] 이름~
  return await axios.get(
    `https://${country}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${process.env.RIOT}`,
  );
}

// get Api 테스트
// async function getSummonerV4test() {
//   console.log(await getSummonerV4('[EUW] DWG KIA'));
//   console.log(await getSummonerV4('[KR] 쭌 베'));
// }
// getSummonerV4test();

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getProGameId(nickName: string): Promise<string[]> {
  try {
    const data = await axios.get(`https://www.trackingthepros.com/player/${nickName}/`);
    const root = await parse(data.data).querySelectorAll('.table')[1].querySelectorAll('td');
    let i = 0;
    const nickNames: string[] = [];
    while (i < root.length) {
      if (i & 1) {
        if (isActivatedID(root[i].textContent)) {
          nickNames.push(root[i - 1].innerText);
        }
      }
      i++;
    }
    return nickNames;
  } catch (e) {
    console.log(e, `${nickName} 이 안되네요`);
  }
  return [];
  // return root.replace(/.+\s/, '');
}

async function makePuuidJSON() {
  const raw = fs.readFileSync(path.join(__dirname, 'proID.json'));
  const datas = JSON.parse(raw.toString()) as IProID[];

  const puuidData = [];
  for (const data of datas) {
    if (!data.Team) {
      continue;
    }
    const nickNames = await getProGameId(data.Proname);
    for (const nickName of nickNames) {
      try {
        const [name, country] = getNameAndCountry(nickName);
        await sleep(25);
        const res = await getSummonerV4({ name, country });
        puuidData.push({
          proname: data.Proname,
          position: data.Position,
          puuid: res.data.puuid,
          team: data.Team,
          accountId: res.data.accountId,
          gameId: res.data.name,
          country: country,
        });
        console.log(`${nickName} 성공`);
      } catch (e) {
        console.log(e, 'riot API 서버에서 데이터 가져오기 실패');
      }
    }
  }
  saveJSON(puuidData, './puuid.json');
}

makePuuidJSON();
// saveJSON({ puuid: 'hi' }, './puuid');
// getProNickname().then((data) => {
//   console.log(data);
// });
