import axios from '.';
import { getAddress } from './getAddress';

async function getMatches({ country, matchID }: { country: string; matchID: number }) {
  const url = getAddress({ country, endpoint: `/lol/match/v4/matches/${matchID}` });
  const { data } = await axios.get(url);
  console.log(data);
}

// 5167369381 getMatchesTest()
function getMatchesTest() {
  getMatches({ country: 'euw1', matchID: 5167369381 });
}
getMatchesTest();
