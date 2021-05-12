import axios from '.';
import { getAddress } from './getAddress';
import fs from 'fs';
import path from 'path';
import { sleep } from '../sleep';

export interface IMatch {
  platformId: string;
  gameId: number;
  champion: number;
  queue: number;
  season: number;
  timestamp: number;
  role: string;
  lane: string;
}
const FEB_1 = 1612184222000;
const SOLO_RANK = 420;

async function getMatchlists({
  proname,
  accountId,
  country,
}: {
  proname: string;
  accountId: string;
  country: string;
}) {
  const endpoint = `/lol/match/v4/matchlists/by-account/${accountId}`;
  const url = getAddress({ endpoint, country });

  try {
    const { data } = await axios.get(url);
    const filteredData = data.matches
      .map((match: IMatch) => {
        if (match.timestamp < FEB_1 || match.queue !== SOLO_RANK) {
          return null;
        }
        return { gameId: match.gameId, timestamp: match.timestamp, champion: match.champion };
      })
      .filter((data: unknown) => data);
    const folderUrl = path.join(__dirname, 'matchlists', country, proname);
    fs.mkdirSync(folderUrl, { recursive: true });
    fs.writeFile(path.join(folderUrl, `${accountId}.json`), JSON.stringify(filteredData), (err) => {
      if (err) throw err;
      console.log(`${country}/${proname}/${accountId} is saved`);
    });
    // throw 'err';
  } catch (e) {
    console.log(e);
  }
}

// getMatchlists 테스트 완료
// async function getMatchlistsTest() {
//   console.log(
//     await getMatchlists({
//       proname: 'Tactical',
//       accountId: 'b65viUhH-eIv6a_BgmqcLkLxuDeXe2SKSHZNyCurXPKyH_E',
//       country: 'na1',
//     }),
//   );
// }
// getMatchlistsTest();

async function getMatchlistsByPuuid() {
  const buffer = fs.readFileSync('./src/libs/puuid.json');
  const puuids = JSON.parse(buffer.toString());

  for (const puuid of puuids) {
    await Promise.all([sleep(25), getMatchlists(puuid).catch(async () => await sleep(25))]);
  }
}

getMatchlistsByPuuid();
// getMatchListsByPuuidJson 테스트 완료
// async function getMatchlistsByPuuidJsonTest() {
//   for (let i = 0; i < 5; i++) {
//     const data = await Promise.all([sleep(5000), getMatchlistsTest()]);
//     console.log(data);
//   }
// }
// getMatchlistsByPuuidJsonTest();
