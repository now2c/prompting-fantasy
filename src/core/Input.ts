export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private textBuffer = '';
  private promptEl: HTMLInputElement | null = null;

  constructor() {
    this.promptEl = document.getElementById('prompt-input') as HTMLInputElement | null;
    window.addEventListener('keydown', (e) => {
      if (this.isPromptActive(e.target)) return;
      const code = e.key;
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          ' ',
          'Enter'
        ].includes(code)
      ) {
        e.preventDefault();
      }
      if (!this.down.has(code)) this.pressed.add(code);
      this.down.add(code);
    });
    window.addEventListener('keyup', (e) => {
      this.down.delete(e.key);
    });
    window.addEventListener('blur', () => this.down.clear());
  }

  private isPromptActive(t: any): boolean {
    return (
      !!this.promptEl &&
      t === this.promptEl &&
      this.promptEl.style.display !== 'none'
    );
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  anyPressed(...codes: string[]): boolean {
    return codes.some((c) => this.pressed.has(c));
  }

  dir(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.down.has('ArrowLeft') || this.down.has('a') || this.down.has('A')) x -= 1;
    if (this.down.has('ArrowRight') || this.down.has('d') || this.down.has('D')) x += 1;
    if (this.down.has('ArrowUp') || this.down.has('w') || this.down.has('W')) y -= 1;
    if (this.down.has('ArrowDown') || this.down.has('s') || this.down.has('S')) y += 1;
    return { x, y };
  }

  update() {
    this.pressed.clear();
    this.textBuffer = '';
  }
}

export const input = new Input();
