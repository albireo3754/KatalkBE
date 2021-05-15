export interface IAddress {
  country: string;
  endpoint: string;
}
export function getAddress({ country, endpoint }: IAddress): string {
  return `https://${country}.api.riotgames.com/${endpoint}`;
}
