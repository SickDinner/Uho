export interface RenderCell {
  char: string;
  fg: string;
  bg?: string;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private columns: number;
  private rows: number;
  private cellWidth: number;
  private cellHeight: number;

  constructor(canvas: HTMLCanvasElement, columns: number, rows: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    this.ctx = ctx;
    this.columns = columns;
    this.rows = rows;
    this.cellWidth = canvas.width / columns;
    this.cellHeight = canvas.height / rows;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = `${Math.floor(this.cellHeight * 0.9)}px "Fira Code", "Courier New", monospace`;
  }

  resize(canvas: HTMLCanvasElement): void {
    this.cellWidth = canvas.width / this.columns;
    this.cellHeight = canvas.height / this.rows;
    this.ctx.font = `${Math.floor(this.cellHeight * 0.9)}px "Fira Code", "Courier New", monospace`;
  }

  clear(background: string = '#000'): void {
    this.ctx.fillStyle = background;
    this.ctx.fillRect(0, 0, this.columns * this.cellWidth, this.rows * this.cellHeight);
  }

  render(grid: RenderCell[][], background: string = '#050710'): void {
    this.clear(background);
    for (let y = 0; y < grid.length; y += 1) {
      const row = grid[y];
      for (let x = 0; x < row.length; x += 1) {
        const cell = row[x];
        this.drawCell(x, y, cell);
      }
    }
  }

  drawCell(x: number, y: number, cell: RenderCell): void {
    const px = (x + 0.5) * this.cellWidth;
    const py = (y + 0.5) * this.cellHeight;

    if (cell.bg) {
      this.ctx.fillStyle = cell.bg;
      this.ctx.fillRect(x * this.cellWidth, y * this.cellHeight, this.cellWidth, this.cellHeight);
    }

    this.ctx.fillStyle = cell.fg;
    this.ctx.fillText(cell.char, px, py);
  }
}
