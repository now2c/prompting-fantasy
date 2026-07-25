import { Combatant } from './core/config';
import { makeParty } from './data/characters';

export const GameState = {
  party: makeParty() as Combatant[],
  mapId: 'town',
  playerTile: { x: 1, y: 6 },
  consumedBattles: new Set<string>(),
  reset() {
    this.party = makeParty() as Combatant[];
    this.mapId = 'town';
    this.playerTile = { x: 1, y: 6 };
    this.consumedBattles.clear();
  }
};
