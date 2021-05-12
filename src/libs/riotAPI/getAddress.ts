export function getAddress({ country, endpoint }: { country: string; endpoint: string }): string {
  return `https://${country}.api.riotgames.com/${endpoint}`;
}
