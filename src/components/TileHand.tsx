import type { Tile } from '../types/game';
import { ALL_TILES, isOdd } from '../lib/gameLogic';

interface Props {
  usedTiles: Tile[];
  selectedTile: Tile | null;
  submitted: boolean;
  onSelect: (tile: Tile) => void;
}

export function TileHand({ usedTiles, selectedTile, submitted, onSelect }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs tracking-widest uppercase" style={{ color: '#888' }}>YOUR TILES</p>
      <div className="flex gap-2 flex-wrap justify-center">
        {ALL_TILES.map((tile) => {
          const used = usedTiles.includes(tile);
          const selected = selectedTile === tile;
          const odd = isOdd(tile);
          return (
            <button
              key={tile}
              onClick={() => !used && !submitted && onSelect(tile)}
              className={`tile w-12 h-16 rounded flex flex-col items-center justify-center font-bold text-xl relative
                ${used ? 'tile-used' : ''}
                ${selected ? 'tile-selected' : ''}
              `}
              style={{
                background: odd ? '#1a0a0f' : '#0a0f1a',
                border: selected
                  ? `2px solid ${odd ? '#ff2d55' : '#00e5ff'}`
                  : `1px solid ${odd ? '#3a1020' : '#103a4a'}`,
                boxShadow: selected
                  ? `0 0 12px ${odd ? '#ff2d55' : '#00e5ff'}, inset 0 0 8px ${odd ? 'rgba(255,45,85,0.2)' : 'rgba(0,229,255,0.2)'}`
                  : 'none',
                color: odd ? '#ff6680' : '#00e5ff',
              }}
            >
              <span className="text-xs opacity-50" style={{ fontFamily: 'serif' }}>
                {odd ? '陽' : '陰'}
              </span>
              <span>{tile}</span>
              {tile === 1 && (
                <span className="absolute -top-1 -right-1 text-xs" style={{ color: '#ffd700', fontSize: '8px' }}>★</span>
              )}
            </button>
          );
        })}
      </div>
      {submitted && (
        <p className="text-sm animate-pulse-neon" style={{ color: '#ffd700' }}>
          待機中… 相手の選択を待っています
        </p>
      )}
    </div>
  );
}
