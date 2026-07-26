import { Engine } from './core/Engine';
import { TitleScene } from './scenes/TitleScene';
import { CONFIG } from './core/config';
import './core/Assets';
import './data/characters';
import './data/enemies';
import { audio } from './systems/Audio';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new Engine(canvas);

function applyScale() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(1, Math.floor(Math.min(vw / CONFIG.baseW, vh / CONFIG.baseH)));
  CONFIG.scale = scale;
  engine.renderer.setDisplayScale(scale);
}
applyScale();
window.addEventListener('resize', applyScale);

function unlock() {
  audio.unlock();
}
window.addEventListener('pointerdown', unlock, { once: false });
window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') audio.toggleMute();
  unlock();
});

engine.start(new TitleScene(engine.scenes));
