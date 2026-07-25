import { Engine } from './core/Engine';
import { TitleScene } from './scenes/TitleScene';
import './core/Assets';
import './data/characters';
import './data/enemies';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new Engine(canvas);
engine.start(new TitleScene(engine.scenes));
